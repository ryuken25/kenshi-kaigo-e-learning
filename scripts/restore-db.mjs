// Muat ulang hasil backup-db.mjs ke database KOSONG (dipakai saat pindah Neon -> Supabase).
//
//   DATABASE_URL=<tujuan> node scripts/restore-db.mjs .backup/neon-xxxx.json --yes
//
// Tanpa --yes skrip ini hanya MELAPOR apa yang akan ditulis dan tidak menyentuh apa pun.
// Terapkan migrasi 001-008 LEBIH DULU; berkas ini memulihkan BARIS, bukan skema.
//
// Kenapa tidak pg_dump saja: dump-nya JSON dan lintas-driver, jadi jalur yang sama
// bekerja untuk Neon HTTP maupun postgres.js tanpa perlu klien psql terpasang.
//
// TIGA HAL YANG MEMBUAT INI TIDAK SESEPELE "INSERT tiap baris":
// 1. Urutan. Kunci di berkas backup sudah induk-dulu (lihat backup-db.mjs), dan urutan
//    itu DIPERTAHANKAN apa adanya — app_users harus ada sebelum baris mana pun yang
//    menunjuk user_id.
// 2. Tipe kolom. Nilai jsonb harus dikirim sebagai STRING hasil JSON.stringify (sama
//    seperti seluruh call site di api/), sedangkan kolom ARRAY harus dikirim sebagai
//    array JS. Membalik dua ini menghasilkan baris yang tersimpan tanpa error tapi
//    isinya salah — persis jebakan yang ditemukan waktu menyiapkan driver Supabase.
//    Tipenya dibaca dari information_schema TUJUAN, bukan ditebak dari bentuk nilainya.
// 3. Idempotensi. ON CONFLICT DO NOTHING supaya restore yang gagal di tengah bisa
//    diulang tanpa menduplikasi baris.
import fs from 'node:fs';
import { scriptDb } from '../api/_db.mjs';

const src = process.argv[2];
const commit = process.argv.includes('--yes');
if (!src) { console.error('Pakai: node scripts/restore-db.mjs <berkas.json> [--yes]'); process.exit(1); }
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL kosong'); process.exit(1); }

const dump = JSON.parse(fs.readFileSync(src, 'utf8'));
const tables = dump.tables && typeof dump.tables === 'object' ? dump.tables : dump;
const sql = scriptDb();

// tipe kolom di TUJUAN — sumber kebenaran untuk cara mengirim tiap nilai
const cols = await sql`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns WHERE table_schema = 'public'`;
const typeOf = new Map(cols.map(c => [c.table_name + '.' + c.column_name, c.data_type]));

const present = new Set(cols.map(c => c.table_name));
let inserted = 0, skipped = 0, missing = [];

for (const [table, rows] of Object.entries(tables)) {
  if (!Array.isArray(rows)) { console.log(`${table.padEnd(20)} dilewati (backup mencatat galat)`); continue; }
  if (!present.has(table)) { missing.push(table); console.log(`${table.padEnd(20)} TIDAK ADA di tujuan — dilewati`); continue; }
  if (!rows.length) { console.log(`${table.padEnd(20)}      0 baris`); continue; }

  const keys = Object.keys(rows[0]);
  const list = keys.map(k => `"${k}"`).join(',');
  const holes = keys.map((_, i) => '$' + (i + 1)).join(',');
  const text = `INSERT INTO ${table} (${list}) VALUES (${holes}) ON CONFLICT DO NOTHING`;

  if (!commit) { console.log(`${table.padEnd(20)} ${String(rows.length).padStart(6)} baris (uji coba)`); skipped += rows.length; continue; }

  let n = 0;
  for (const row of rows) {
    const params = keys.map(k => {
      const v = row[k], t = typeOf.get(table + '.' + k) || '';
      if (v === null || v === undefined) return null;
      // ARRAY harus tetap array JS; jsonb/json harus string. Objek/array yang MASUK ke
      // kolom json karena itu di-stringify, sedangkan kolom ARRAY dibiarkan.
      if (t === 'ARRAY') return Array.isArray(v) ? v : [v];
      if (t === 'jsonb' || t === 'json') return typeof v === 'string' ? v : JSON.stringify(v);
      return v;
    });
    await sql.query(text, params);
    n++;
  }
  inserted += n;
  console.log(`${table.padEnd(20)} ${String(n).padStart(6)} baris disisipkan`);
}

if (sql.end) await sql.end();
if (!commit) {
  console.log(`\nUJI COBA — tidak ada yang ditulis. ${skipped} baris siap. Ulangi dengan --yes untuk benar-benar memulihkan.`);
} else {
  console.log(`\nSelesai: ${inserted} baris disisipkan.`);
  console.log('Verifikasi berikutnya: node scripts/verify-schema.mjs lalu node scripts/verify-consistency.mjs (harus cetak []).');
}
if (missing.length) { console.error(`\n${missing.length} tabel tidak ada di tujuan: ${missing.join(', ')} — migrasi 001-008 sudah diterapkan?`); process.exit(1); }
