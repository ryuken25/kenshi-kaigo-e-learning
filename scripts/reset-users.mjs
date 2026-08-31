// reset-users.mjs — HAPUS SEMUA DATA USER dari database produksi.
//
//   node scripts/reset-users.mjs --yes
//
// Yang dihapus: akun, sesi, token magic-link, seluruh progres belajar & ujian,
// pertemanan, achievement yang sudah diraih, dan jejak idempotensi.
// Yang TIDAK disentuh: tabel `achievements` — itu KATALOG lencana (seed migrasi 007),
// bukan data user; menghapusnya membuat evaluateAchievements kehilangan definisinya.
//
// DESTRUKTIF dan tidak bisa dibatalkan. Ambil dump dulu:
//   node scripts/backup-db.mjs .backup/sebelum-reset.json
import { db } from '../api/_db.mjs';

if (!process.argv.includes('--yes')) {
  console.error('Tolak: jalankan dengan --yes bila memang ingin menghapus SEMUA user.');
  process.exit(1);
}
const sql = db();

// Urutan mengikuti arah foreign key (anak dulu), jadi skrip ini tetap benar walau
// suatu saat ada FK yang dibuat tanpa ON DELETE CASCADE.
const urutan = [
  'leaderboard_seen', 'user_achievements', 'friendships', 'final_attempts', 'final_progress',
  'progress_merges', 'level_attempts', 'question_attempts', 'daily_activity', 'level_progress',
  'app_sessions', 'magic_tokens', 'app_users',
];

const sebelum = {};
for (const t of urutan) sebelum[t] = (await sql.query(`SELECT COUNT(*)::int n FROM ${t}`))[0].n;
console.log('Sebelum:', Object.entries(sebelum).filter(([, n]) => n).map(([t, n]) => `${t}=${n}`).join(' ') || '(kosong)');

for (const t of urutan) await sql.query(`DELETE FROM ${t}`);

let sisa = 0;
for (const t of urutan) sisa += (await sql.query(`SELECT COUNT(*)::int n FROM ${t}`))[0].n;
const katalog = (await sql.query('SELECT COUNT(*)::int n FROM achievements'))[0].n;
console.log(`Sesudah: ${sisa} baris di 13 tabel user (harus 0). Katalog achievements utuh: ${katalog} baris.`);
process.exit(sisa === 0 ? 0 : 1);
