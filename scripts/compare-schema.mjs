// Bandingkan skema DUA database kolom-per-kolom dan constraint-per-constraint.
//
//   SRC_URL=<neon> DST_URL=<supabase> node scripts/compare-schema.mjs
//
// Kenapa ini perlu padahal sudah ada verify-schema.mjs: berkas itu MENCETAK skema,
// tidak membandingkannya — jadi mata manusia yang harus mencocokkan ratusan baris.
// Dan run-migration.mjs TIDAK atomik (ia membuang BEGIN/COMMIT karena driver HTTP
// Neon auto-commit per pernyataan), sehingga migrasi yang gagal di tengah
// meninggalkan skema separuh jadi TANPA satu pun galat di akhir. Satu-satunya cara
// jujur menyatakan "migrasi mendarat" adalah membandingkannya dengan sumber.
//
// Keluar 0 hanya kalau IDENTIK. Baca-saja di kedua sisi.
import { dbFrom } from '../api/_db.mjs';

const SRC = process.env.SRC_URL, DST = process.env.DST_URL;
if (!SRC || !DST) { console.error('Pakai: SRC_URL=<asal> DST_URL=<tujuan> node scripts/compare-schema.mjs'); process.exit(1); }

// Satu instance per URL; dbFrom memilih driver dari host masing-masing, jadi
// membandingkan Neon (HTTP) dengan Supabase (postgres.js) berjalan apa adanya.
const a = dbFrom(SRC), b = dbFrom(DST);

const COLS = `SELECT table_name||'.'||column_name AS k,
    data_type||' null='||is_nullable||' default='||coalesce(column_default,'-') AS v
  FROM information_schema.columns WHERE table_schema='public' ORDER BY 1`;
const CONS = `SELECT c.conrelid::regclass::text||'.'||c.conname AS k,
    pg_get_constraintdef(c.oid) AS v
  FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
  WHERE n.nspname='public' ORDER BY 1`;
const IDX = `SELECT schemaname||'.'||indexname AS k, indexdef AS v
  FROM pg_indexes WHERE schemaname='public' ORDER BY 1`;

const asMap = rows => new Map(rows.map(r => [r.k, r.v]));

async function bagian(nama, sqlText) {
  const [ra, rb] = await Promise.all([a.query(sqlText), b.query(sqlText)]);
  const ma = asMap(ra), mb = asMap(rb);
  const hilang = [...ma.keys()].filter(k => !mb.has(k));
  const lebih = [...mb.keys()].filter(k => !ma.has(k));
  const beda = [...ma.keys()].filter(k => mb.has(k) && mb.get(k) !== ma.get(k));
  console.log(`\n── ${nama}: asal ${ma.size}, tujuan ${mb.size}`);
  for (const k of hilang) console.log(`   HILANG di tujuan  ${k}  (${ma.get(k)})`);
  for (const k of lebih) console.log(`   LEBIH di tujuan   ${k}  (${mb.get(k)})`);
  for (const k of beda) console.log(`   BEDA              ${k}\n       asal   : ${ma.get(k)}\n       tujuan : ${mb.get(k)}`);
  if (!hilang.length && !lebih.length && !beda.length) console.log('   identik');
  return hilang.length + lebih.length + beda.length;
}

const [va] = await a.query('SELECT version() v');
const [vb] = await b.query('SELECT version() v');
console.log('asal   :', va.v.split(' on ')[0]);
console.log('tujuan :', vb.v.split(' on ')[0]);

let n = 0;
n += await bagian('KOLOM', COLS);
n += await bagian('CONSTRAINT', CONS);
n += await bagian('INDEX', IDX);

// Jumlah baris per tabel — bukan bagian skema, tapi inilah yang menjawab
// "datanya sudah pindah belum" dalam satu tatapan.
const CNT = `SELECT relname AS k, n_live_tup::text AS v FROM pg_stat_user_tables ORDER BY 1`;
const [ca, cb] = await Promise.all([a.query(CNT), b.query(CNT)]);
const ma = asMap(ca), mb = asMap(cb);
console.log('\n── PERKIRAAN BARIS (informatif, dari pg_stat_user_tables)');
for (const k of new Set([...ma.keys(), ...mb.keys()]))
  console.log(`   ${k.padEnd(20)} asal ${String(ma.get(k) ?? '-').padStart(6)}   tujuan ${String(mb.get(k) ?? '-').padStart(6)}`);

for (const s of [a, b]) if (typeof s.end === 'function') await s.end();

console.log(n ? `\nBEDA — ${n} selisih skema. Migrasi BELUM mendarat utuh.` : '\nIDENTIK — skema tujuan sama persis dengan asal.');
process.exit(n ? 1 : 0);
