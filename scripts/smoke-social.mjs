// ============================================================================
// SMOKE TEST E2E — fitur sosial (profile/friends/leaderboard/achievements).
// Panggil Vercel handlers IN-PROCESS lawan Neon prod, tanpa deploy:
//   DATABASE_URL="$(cat .git/dburl)" node scripts/smoke-social.mjs
// (DATABASE_URL boleh kosong — script baca .git/dburl sendiri.)
// Bikin 2 user e2e internal, jalanin semua flow, lalu HAPUS lagi total.
// Exit code: 0 = semua hijau, 1 = ada asersi gagal.
// ============================================================================
import fs from 'node:fs';
import crypto from 'node:crypto';
import { scriptDb } from '../api/_db.mjs';

import profileHandler from '../api/profile.mjs';
import friendsHandler from '../api/friends.mjs';
import leaderboardHandler from '../api/leaderboard.mjs';
import achievementsHandler from '../api/achievements.mjs';
import progressHandler from '../api/progress.mjs';

const url = process.env.DATABASE_URL || fs.readFileSync('.git/dburl', 'utf8').trim();
const sql = scriptDb(url);
const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');

const EMAIL_A = 'e2e-smoke-test@kaigokitty.internal';
const EMAIL_B = 'e2e-smoke-b@kaigokitty.internal';

let pass = 0, fail = 0;
const assert = (cond, name) => { if (cond) { pass++; console.log(`  ok  ${name}`); } else { fail++; console.log(`  FAIL ${name}`); } };

// ---- harness req/res palsu ------------------------------------------------
function call(handler, { method = 'GET', query = {}, body = null, cookie = '' }) {
  const req = { method, query, body, headers: { cookie } };
  const res = { statusCode: 200, headers: {}, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (j) => { res.body = j; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.send = (s) => { res.body = s; return res; };
  return handler(req, res).then(() => res);
}

// ---- setup: 2 user + session cookie langsung di DB ------------------------
async function makeUser(email) {
  const users = await sql`INSERT INTO app_users(email, name) VALUES(${email}, ${email.split('@')[0]})
    ON CONFLICT (lower(email)) DO UPDATE SET updated_at = now() RETURNING id`;
  const session = crypto.randomBytes(32).toString('base64url');
  await sql`INSERT INTO app_sessions(user_id, token_hash, expires_at, user_agent, ip_hash)
    VALUES(${users[0].id}, ${hash(session)}, now() + interval '30 days', 'smoke-social', ${hash('smoke')})`;
  return { id: users[0].id, cookie: `kaigo_session=${session}` };
}

async function wipeUser(id) {
  await sql`DELETE FROM friendships WHERE user_id=${id} OR friend_id=${id}`;
  await sql`DELETE FROM user_achievements WHERE user_id=${id}`;
  await sql`DELETE FROM leaderboard_seen WHERE user_id=${id}`;
  await sql`DELETE FROM level_attempts WHERE user_id=${id}`;
  await sql`DELETE FROM level_progress WHERE user_id=${id}`;
  await sql`DELETE FROM daily_activity WHERE user_id=${id}`;
  await sql`DELETE FROM app_sessions WHERE user_id=${id}`;
  await sql`DELETE FROM app_users WHERE id=${id}`;
}

let A, B;
try {
  A = await makeUser(EMAIL_A);
  B = await makeUser(EMAIL_B);
  // mulai dari keadaan bersih & deterministik
  await wipeUser(A.id); await wipeUser(B.id);
  A = await makeUser(EMAIL_A); B = await makeUser(EMAIL_B);

  console.log('\n[1] GET /api/profile — kondisi awal');
  let r = await call(profileHandler, { cookie: A.cookie });
  assert(r.statusCode === 200, 'profile A 200');
  assert(r.body.profile.handle === null, 'handle awal null');
  assert(r.body.handleCooldownEndsAt === null, 'belum pernah set handle → tidak ada cooldown');
  assert(r.body.profile.theme === 'kitty', 'tema default kitty');

  console.log('\n[2] PATCH profile — set handle + identitas lengkap (user A)');
  r = await call(profileHandler, { method: 'PATCH', cookie: A.cookie, body: {
    handle: 'E2E_AtAr_A', displayName: 'Atar Uji', avatarKey: 'hk-pink-bow',
    theme: 'sora', gender: 'male', visibility: 'public', onboardedStep: 'done',
  }});
  assert(r.statusCode === 200, 'PATCH 200');
  assert(r.body.profile.handle === 'e2e_atar_a', 'handle dinormalisasi lowercase');
  assert(r.body.profile.theme === 'sora', 'tema tersimpan sora');
  assert(Array.isArray(r.body.newAchievements), 'newAchievements ada');
  const ids = new Set(r.body.newAchievements.map(a => a.id));
  assert(ids.has('handle-set'), 'achievement handle-set terbuka');
  assert(ids.has('avatar-pick'), 'achievement avatar-pick terbuka');
  assert(ids.has('theme-switch'), 'achievement theme-switch terbuka');
  assert(ids.has('profile-setup'), 'achievement profile-setup terbuka');
  assert(r.body.handleCooldownEndsAt !== null, 'cooldown mulai aktif setelah set pertama');

  console.log('\n[3] Aturan handle');
  r = await call(profileHandler, { method: 'PATCH', cookie: A.cookie, body: { handle: 'e2e_lain' } });
  assert(r.statusCode === 409 && r.body.error === 'handle_cooldown', 'ganti handle <7 hari → 409 cooldown + retryAt ' + (r.body.retryAt ? 'ok' : 'MISSING retryAt'));
  r = await call(profileHandler, { method: 'PATCH', cookie: A.cookie, body: { handle: 'ABC' } });
  assert(r.statusCode === 400, 'handle uppercase → 400 (regex setelah lowercase tetap valid? cek logika)');
  // 'ABC' → lowercase 'abc' → 3 char < 4 → memang 400. Benar.
  r = await call(profileHandler, { method: 'PATCH', cookie: A.cookie, body: { handle: 'ad' } });
  assert(r.statusCode === 400, 'handle terlalu pendek → 400');
  r = await call(profileHandler, { method: 'PATCH', cookie: A.cookie, body: { handle: 'admin' } });
  assert(r.statusCode === 409 && r.body.error === 'handle_reserved', 'handle reserved → 409');
  r = await call(profileHandler, { method: 'PATCH', cookie: A.cookie, body: { displayName: 'x'.repeat(25) } });
  assert(r.statusCode === 400, 'displayName >24 → 400');
  r = await call(profileHandler, { method: 'PATCH', cookie: A.cookie, body: { theme: 'momo' } });
  assert(r.statusCode === 400, 'tema tidak dikenal → 400');

  console.log('\n[4] GET /api/achievements + whitelist client-report');
  r = await call(achievementsHandler, { cookie: A.cookie });
  assert(r.statusCode === 200, 'achievements 200');
  assert(r.body.achievements.length === 35, `katalog 35 achievement (dapat ${r.body.achievements.length})`);
  assert(r.body.unlockedCount === 4, `unlockedCount 4 (dapat ${r.body.unlockedCount})`);
  assert(r.body.frameUnlocked === 'none', '4 unlock < 5 → belum dapat frame');
  assert(r.body.frameTiers[0].frame === 'bronze', 'frameTiers ascending dari bronze');
  r = await call(achievementsHandler, { method: 'POST', cookie: A.cookie, body: { ids: ['exam-pass', 'glossary-10', 'evil-id'] } });
  assert(r.statusCode === 200 && r.body.newAchievements.length === 2, 'whitelist: 2 diterima, evil-id ditolak diam-diam');
  r = await call(achievementsHandler, { method: 'POST', cookie: A.cookie, body: { ids: ['exam-pass'] } });
  assert(r.body.newAchievements.length === 0, 'report ulang → idempoten, 0 baru');

  console.log('\n[5] Friends — request/accept/list/block');
  r = await call(profileHandler, { method: 'PATCH', cookie: B.cookie, body: { handle: 'e2e_atar_b' } });
  assert(r.statusCode === 200, 'B set handle');
  r = await call(friendsHandler, { cookie: A.cookie, query: { q: 'e2e_atar_b' } });
  assert(r.statusCode === 200 && r.body.result?.relationship === 'none', 'cari B → relationship none');
  r = await call(friendsHandler, { method: 'POST', cookie: A.cookie, body: { action: 'request', handle: 'e2e_atar_b' } });
  assert(r.statusCode === 200 && r.body.ok && !r.body.autoAccepted, 'A request B → pending');
  r = await call(friendsHandler, { method: 'POST', cookie: A.cookie, body: { action: 'request', handle: 'e2e_atar_b' } });
  assert(r.statusCode === 409 && r.body.error === 'already_requested', 'request ganda → 409');
  r = await call(friendsHandler, { cookie: B.cookie });
  assert(r.body.incoming.length === 1 && r.body.incoming[0].handle === 'e2e_atar_a', 'B lihat incoming dari A');
  r = await call(friendsHandler, { method: 'POST', cookie: B.cookie, body: { action: 'accept', handle: 'e2e_atar_a' } });
  assert(r.statusCode === 200 && r.body.ok, 'B accept → berteman');
  assert(r.body.newAchievements.some(a => a.id === 'first-friend'), 'first-friend terbuka untuk B');
  r = await call(friendsHandler, { cookie: A.cookie });
  assert(r.body.friends.length === 1 && r.body.friends[0].handle === 'e2e_atar_b', 'A lihat B di daftar teman');
  r = await call(friendsHandler, { method: 'POST', cookie: B.cookie, body: { action: 'block', handle: 'e2e_atar_a' } });
  assert(r.statusCode === 200, 'B block A');
  r = await call(friendsHandler, { method: 'POST', cookie: A.cookie, body: { action: 'request', handle: 'e2e_atar_b' } });
  assert(r.statusCode === 403 && r.body.error === 'blocked', 'A request saat diblokir → 403');

  // OTORISASI: A TIDAK BOLEH bisa melepas blokir milik B. Dulu bisa, dua panggilan
  // saja: 'block' menghapus baris dua arah tanpa filter status (ikut membuang baris
  // blokir B), lalu 'unblock' membuang baris A sendiri — nol baris tersisa, B tidak
  // pernah diberi tahu, dan permintaan A masuk lagi ke inbox B.
  r = await call(friendsHandler, { method: 'POST', cookie: A.cookie, body: { action: 'block', handle: 'e2e_atar_b' } });
  assert(r.statusCode === 200, 'A balas block B');
  r = await call(friendsHandler, { method: 'POST', cookie: A.cookie, body: { action: 'unblock', handle: 'e2e_atar_b' } });
  assert(r.statusCode === 200, 'A unblock B');
  const blokirB = await sql`SELECT status FROM friendships WHERE user_id=${B.id} AND friend_id=${A.id}`;
  assert(blokirB[0]?.status === 'blocked', 'blokir milik B SELAMAT dari block+unblock milik A');
  r = await call(friendsHandler, { method: 'POST', cookie: A.cookie, body: { action: 'request', handle: 'e2e_atar_b' } });
  assert(r.statusCode === 403 && r.body.error === 'blocked', 'A tetap tertahan blokir B sesudahnya');

  // block dua kali beruntun tidak boleh 500 (INSERT tanpa ON CONFLICT dulu bisa).
  r = await call(friendsHandler, { method: 'POST', cookie: B.cookie, body: { action: 'block', handle: 'e2e_atar_a' } });
  assert(r.statusCode === 200, 'block berulang tetap 200, bukan 500');

  r = await call(friendsHandler, { method: 'POST', cookie: B.cookie, body: { action: 'unblock', handle: 'e2e_atar_a' } });
  assert(r.statusCode === 200, 'B unblock A');
  // Block memang MEMUTUS pertemanan (semantik yang benar). Re-add supaya
  // langkah leaderboard punya dua orang di lingkaran.
  await call(friendsHandler, { method: 'POST', cookie: A.cookie, body: { action: 'request', handle: 'e2e_atar_b' } });
  r = await call(friendsHandler, { method: 'POST', cookie: B.cookie, body: { action: 'accept', handle: 'e2e_atar_a' } });
  assert(r.statusCode === 200 && r.body.ok, 're-add setelah unblock → berteman lagi');

  console.log('\n[6] Leaderboard friends + global');
  r = await call(leaderboardHandler, { cookie: A.cookie });
  assert(r.statusCode === 200 && r.body.scope === 'friends', 'friends scope default');
  assert(r.body.rows.length === 2, '2 baris: A + B');
  assert(r.body.rows.some(x => x.isMe), 'baris sendiri ditandai isMe');
  await sql`DELETE FROM leaderboard_seen WHERE user_id=${A.id}`; // determinisme delta
  r = await call(leaderboardHandler, { cookie: A.cookie, query: { scope: 'global' } });
  assert(r.statusCode === 200 && r.body.scope === 'global', 'global scope');
  // Papan mingguan dibangun dari daily_activity SEJAK SENIN. Di titik ini user
  // belum menyetor apa pun minggu ini (step [7] baru jalan sesudah blok ini), jadi
  // ia memang BUKAN peserta papan dan rank-nya harus null.
  // Asersi lama `rank >= 1` justru mengunci bugnya: rumus lama COUNT(xp > punyaku)+1
  // menghasilkan rank 1 untuk papan KOSONG, dan evaluateLeaderboardAchievements
  // lalu membagikan lb-appear + lb-top50 + lb-top10 ke user ber-XP 0 — setiap Senin.
  assert(r.body.me && r.body.me.rank === null, `belum ada aktivitas minggu ini -> rank null (dapat ${r.body.me?.rank})`);
  assert(r.body.me.inTop === false, 'rank null -> inTop false');
  assert(Array.isArray(r.body.newAchievements) && r.body.newAchievements.length === 0, 'rank null -> TIDAK membagikan achievement peringkat');
  const seenKosong = await sql`SELECT count(*)::int c FROM leaderboard_seen WHERE user_id=${A.id} AND scope='global'`;
  assert(seenKosong[0].c === 0, 'rank null -> leaderboard_seen tidak dicatat');

  console.log('\n[7] POST /api/progress → hook achievement + idempotensi');
  const attemptId = crypto.randomUUID();
  r = await call(progressHandler, { method: 'POST', cookie: A.cookie, body: {
    sectionId: 1, levelId: 1, score: 100, correctCount: 5, totalCount: 5, attemptId,
  }});
  assert(r.statusCode === 200 && r.body.level.status === 'completed', 'level 1/1 completed resmi');
  assert(Array.isArray(r.body.newAchievements) && r.body.newAchievements.some(a => a.id === 'first-steps'), 'first-steps terbuka via progress');
  assert(r.body.newAchievements.some(a => a.id === 'perfect-score'), 'perfect-score terbuka (score 100)');
  const totalXp1 = r.body.totalXp;
  r = await call(progressHandler, { method: 'POST', cookie: A.cookie, body: {
    sectionId: 1, levelId: 1, score: 100, correctCount: 5, totalCount: 5, attemptId,
  }});
  assert(r.body.totalXp === totalXp1, 'replay attemptId sama → XP tidak dobel (cache idempoten)');

  console.log('\n[7b] Papan global SESUDAH ada aktivitas → rank jadi angka nyata');
  r = await call(leaderboardHandler, { cookie: A.cookie, query: { scope: 'global' } });
  assert(r.body.me && typeof r.body.me.rank === 'number' && r.body.me.rank >= 1, `rank terisi setelah submit (dapat ${r.body.me?.rank})`);
  assert(r.body.me.inTop === true, 'rank nyata -> inTop true');
  assert(r.body.rows.some(x => x.isMe), 'muncul sebagai baris di papan');
  const rank1 = r.body.me.rank;
  assert(r.body.me.delta === null, 'kunjungan pertama dengan rank nyata -> delta null');
  r = await call(leaderboardHandler, { cookie: A.cookie, query: { scope: 'global' } });
  assert(r.body.me.rank === rank1 && r.body.me.delta === 0, 'kunjungan kedua -> rank tetap, delta 0');

  console.log('\n[8] RESET progress → achievement ikut terhapus');
  r = await call(progressHandler, { method: 'DELETE', cookie: A.cookie, body: { confirm: 'RESET' } });
  assert(r.statusCode === 200 && r.body.ok, 'reset ok');
  r = await call(achievementsHandler, { cookie: A.cookie });
  // handle-set dkk sudah hilang karena reset total (evaluasi ulang baru terjadi di PATCH berikutnya)
  assert(r.body.unlockedCount === 0, `reset menghapus semua unlock (dapat ${r.body.unlockedCount})`);
  r = await call(friendsHandler, { cookie: B.cookie });
  assert(r.body.friends.length === 1, 'reset progress TIDAK memutus pertemanan (relasi sosial bukan stats belajar)');
} catch (e) {
  fail++;
  console.error('\nEXCEPTION saat smoke test:', e);
} finally {
  if (A) await wipeUser(A.id);
  if (B) await wipeUser(B.id);
  await sql`DELETE FROM magic_tokens WHERE email IN (${EMAIL_A}, ${EMAIL_B})`;
}

await sql.end(); // postgres.js: tanpa ini proses menggantung (neon: no-op)
console.log(`\n━━━━━━━━ HASIL: ${pass} PASS, ${fail} FAIL ━━━━━━━━`);
process.exit(fail ? 1 : 0);
