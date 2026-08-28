// Dump SELURUH tabel publik ke satu berkas JSON.
//
// Dulu berkas ini hanya menyalin empat tabel (app_users, magic_tokens, app_sessions,
// level_progress) sementara skemanya sudah 14 tabel — jadi "backup"-nya kehilangan
// final_progress, friendships, user_achievements, daily_activity, dan sisanya.
// Sekarang daftar tabelnya dibaca dari information_schema, jadi migrasi berikutnya
// ikut terbawa tanpa perlu menyunting berkas ini lagi.
//
//   DATABASE_URL=... node scripts/backup-db.mjs .backup/neon-2026-08-28.json
//
// Urutan tabel di keluaran = urutan aman untuk RESTORE (induk sebelum anak), bukan
// abjad: app_users harus ada sebelum baris apa pun yang menunjuk user_id.
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL kosong'); process.exit(1); }
const dest = process.argv[2];
if (!dest) { console.error('Pakai: node scripts/backup-db.mjs <berkas.json>'); process.exit(1); }

const sql = neon(url);

// Induk dulu, lalu anak. Tabel yang tidak terdaftar di sini diletakkan di belakang
// menurut abjad — aman untuk dump, dan untuk restore tinggal cek FK-nya.
const ORDER = ['achievements', 'app_users', 'app_sessions', 'magic_tokens', 'level_progress',
  'final_progress', 'daily_activity', 'question_attempts', 'level_attempts', 'final_attempts',
  'friendships', 'user_achievements', 'progress_merges', 'leaderboard_seen'];

const found = (await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
).map(r => r.table_name);

const tables = [...ORDER.filter(t => found.includes(t)), ...found.filter(t => !ORDER.includes(t))];
const extra = found.filter(t => !ORDER.includes(t));
if (extra.length) console.log('catatan: tabel di luar daftar urut ->', extra.join(', '));

const out = { takenAt: new Date().toISOString(), source: 'neon', tables: {} };
let total = 0, failed = 0;
for (const t of tables) {
  try {
    const rows = await sql.query(`SELECT * FROM ${t}`);
    out.tables[t] = rows;
    total += rows.length;
    console.log(`${t.padEnd(20)} ${String(rows.length).padStart(6)} baris`);
  } catch (e) {
    out.tables[t] = { error: String(e.message || e) };
    failed++;
    console.log(`${t.padEnd(20)} GAGAL ${e.message}`);
  }
}
out.rowCounts = Object.fromEntries(tables.map(t => [t, Array.isArray(out.tables[t]) ? out.tables[t].length : null]));

fs.mkdirSync(path.dirname(path.resolve(dest)), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(`\n${tables.length} tabel, ${total} baris -> ${dest}`);
if (failed) { console.error(`${failed} tabel GAGAL dibaca — backup TIDAK lengkap`); process.exit(1); }
