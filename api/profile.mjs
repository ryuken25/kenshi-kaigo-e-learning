import { db } from './_db.mjs';
import { requireUser } from './_auth.mjs';
import { evaluateAchievements } from './_achievements.mjs';
import { CHARACTERS } from './_characters.mjs';

// GET /api/profile — profil lengkap user login + status cooldown handle.
// PATCH /api/profile — update field parsial. Semua nilai divalidasi di SERVER
// sebelum menyentuh DB (CHECK constraint di 007 cuma jaring terakhir).
//
// PENTING — aturan handle dari user:
//   1. huruf kecil saja (+angka/underscore), 4-14 karakter  → HANDLE_RE
//   2. tidak boleh sama dengan user lain                    → unique index DB + 409
//   3. ganti handle cuma boleh tiap 7 hari                  → handle_changed_at,
//      dicek di server; set pertama kali (dari NULL) GRATIS, cooldown cuma utk GANTI.
export const HANDLE_RE = /^[a-z0-9_]{4,14}$/;
export const HANDLE_COOLDOWN_DAYS = 7;

const THEMES = ['kitty','sora','matcha','yozora'];
const GENDERS = ['male','female','other','prefer_not'];
const VISIBILITIES = ['public','private'];
const ONBOARD_STEPS = ['gender','handle','done'];
// Preset avatar = file yang BENAR-BENAR ADA di public/assets/hellokitty/.
// 'kitty-1' itu default DB; client memetakannya ke hk-face-icon.png.
export const AVATAR_KEYS = ['kitty-1','hk-cute-emoji','hk-balloons','hk-birthday-camera','hk-desktop-art','hk-face-icon','hk-illustration-1','hk-pink-bow','hk-sticker-flower'];
// Handle yang menyerupai akun resmi sistem — tidak boleh dipakai publik.
const RESERVED = new Set(['admin','administrator','kaigo','kitty','support','help','mod','moderator','official','staff','api','system','null','undefined','www','root']);

// Kapan user boleh ganti handle lagi. null = belum pernah set (bebas ganti/set).
export function handleCooldownEnd(handleChangedAt) {
  if (!handleChangedAt) return null;
  return new Date(new Date(handleChangedAt).getTime() + HANDLE_COOLDOWN_DAYS * 86400000).toISOString();
}

async function fetchProfile(sql, userId) {
  const rows = await sql`
    SELECT handle, display_name, avatar_key, theme, gender, onboarded_step, visibility,
           avatar_frame, total_xp, streak_current, streak_longest, handle_changed_at,
           character_id, characters_unlocked
    FROM app_users WHERE id=${userId}`;
  return rows[0] || null;
}

const toJson = (p) => ({
  handle: p.handle, displayName: p.display_name, avatarKey: p.avatar_key, theme: p.theme,
  gender: p.gender, onboardedStep: p.onboarded_step, visibility: p.visibility,
  avatarFrame: p.avatar_frame, totalXp: p.total_xp, streakCurrent: p.streak_current,
  streakLongest: p.streak_longest,
  characterId: p.character_id, charactersUnlocked: p.characters_unlocked || [],
});

export default async function handler(req, res) {
  try {
    const sql = db();
    const user = await requireUser(sql, req);
    if (!user) return res.status(401).json({ error: 'Not signed in' });

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'private, no-store');
      const p = await fetchProfile(sql, user.id);
      if (!p) return res.status(404).json({ error: 'not_found' });
      const ach = await sql`SELECT COUNT(*)::int n FROM user_achievements WHERE user_id=${user.id}`;
      return res.status(200).json({ profile: toJson(p), handleCooldownEndsAt: handleCooldownEnd(p.handle_changed_at), achievementsCount: ach[0].n });
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const p = await fetchProfile(sql, user.id);
      if (!p) return res.status(404).json({ error: 'not_found' });

      // UPDATE dinamis: tagged-template neon tidak bisa kompose fragmen, jadi
      // pakai sql.query($n) — AMAN karena nama kolom datang dari kode di bawah
      // (bukan dari input), dan semua value lewat parameter.
      const params = [];
      let setSql = '';
      const push = (col, val) => { params.push(val); setSql += (setSql ? ', ' : '') + `${col} = $${params.length}`; };

      if (body.handle !== undefined) {
        const h = String(body.handle).trim().toLowerCase();
        if (!HANDLE_RE.test(h)) return res.status(400).json({ error: 'invalid_input', message: 'Handle: 4-14 karakter, huruf kecil/angka/underscore saja' });
        if (RESERVED.has(h)) return res.status(409).json({ error: 'handle_reserved', message: 'Handle ini dicadangkan sistem' });
        if (h !== p.handle) {
          // Cooldown 7 hari HANYA untuk mengganti. Set pertama (dari NULL) bebas.
          const cooldownEnd = handleCooldownEnd(p.handle_changed_at);
          if (p.handle !== null && cooldownEnd && Date.now() < new Date(cooldownEnd).getTime())
            return res.status(409).json({ error: 'handle_cooldown', retryAt: cooldownEnd, message: `Handle baru bisa diganti lagi setelah ${new Date(cooldownEnd).toLocaleDateString('id-ID', { timeZone: 'Asia/Tokyo' })}` });
          push('handle', h);
          push('handle_changed_at', new Date().toISOString());
        }
      }
      if (body.displayName !== undefined) {
        const d = String(body.displayName).trim();
        if (!d || d.length > 24) return res.status(400).json({ error: 'invalid_input', message: 'Nama tampilan: 1-24 karakter' });
        push('display_name', d);
      }
      if (body.avatarKey !== undefined) {
        if (!AVATAR_KEYS.includes(body.avatarKey)) return res.status(400).json({ error: 'invalid_input', message: 'Avatar tidak dikenal' });
        push('avatar_key', body.avatarKey);
      }
      if (body.theme !== undefined) {
        if (!THEMES.includes(body.theme)) return res.status(400).json({ error: 'invalid_input', message: 'Tema tidak dikenal' });
        push('theme', body.theme);
      }
      if (body.characterId !== undefined) {
        const c = String(body.characterId);
        if (!CHARACTERS.includes(c)) return res.status(400).json({ error: 'invalid_input', message: 'Karakter tidak dikenal' });
        // doc 49: server WAJIB cek karakter ada di characters_unlocked — kalau
        // tidak, karakter terkunci (termasuk nagi/beni "segera hadir") bisa
        // dipakai lewat API.
        if (!(p.characters_unlocked || []).includes(c)) return res.status(403).json({ error: 'character_locked', message: 'Karakter ini belum terbuka' });
        push('character_id', c);
      }
      if (body.gender !== undefined) {
        if (!GENDERS.includes(body.gender)) return res.status(400).json({ error: 'invalid_input', message: 'Pilihan tidak dikenal' });
        // Pemetaan gender→tema sengaja di CLIENT (kirim theme + gender bareng
        // dalam satu PATCH): kalau server yang menggandeng, ganti tema harus
        // selalu lewat ganti gender dan datanya jadi kaku.
        push('gender', body.gender);
      }
      if (body.visibility !== undefined) {
        if (!VISIBILITIES.includes(body.visibility)) return res.status(400).json({ error: 'invalid_input', message: 'Visibilitas tidak dikenal' });
        push('visibility', body.visibility);
      }
      if (body.onboardedStep !== undefined) {
        if (!ONBOARD_STEPS.includes(body.onboardedStep)) return res.status(400).json({ error: 'invalid_input', message: 'Step onboarding tidak dikenal' });
        push('onboarded_step', body.onboardedStep);
      }
      if (!setSql) return res.status(400).json({ error: 'invalid_input', message: 'Tidak ada field untuk diupdate' });

      params.push(user.id);
      try {
        await sql.query(`UPDATE app_users SET ${setSql}, updated_at = now() WHERE id = $${params.length}`, params);
      } catch (e) {
        // 23505 = unique violation → handle baru saja diambil orang lain (race)
        // atau handle unik bentrok. Constraint lain tidak mungkin dari input tervalidasi.
        if (e.code === '23505' || String(e.message).includes('handle'))
          return res.status(409).json({ error: 'handle_taken', message: 'Handle sudah dipakai orang lain' });
        throw e;
      }

      const newAchievements = await evaluateAchievements(sql, user.id);
      const fresh = await fetchProfile(sql, user.id);
      return res.status(200).json({ profile: toJson(fresh), handleCooldownEndsAt: handleCooldownEnd(fresh.handle_changed_at), newAchievements });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server_error', message: 'Profile service unavailable' });
  }
}
