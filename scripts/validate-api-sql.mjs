// Gate: fragmen sql`...` yang DISARANGKAN sebagai nilai parameter di dalam tagged
// template lain. Pola ini MERUSAK PRODUKSI 2026-08-28 dan gagalnya menyesatkan.
//
// Kenapa gate ini ada, bukan sekadar catatan di review:
// Kodenya sah secara sintaksis, lolos `npm run build`, dan JALAN BENAR selama
// databasenya masih Neon — driver neon mengenali query bersarang dan menyusunnya
// jadi potongan SQL. Begitu DATABASE_URL pindah ke host non-Neon, api/_db.mjs
// diam-diam berganti ke postgres.js, dan pola yang sama mulai melempar:
//   sql`now()` dieksekusi sebagai query tersendiri  -> "syntax error at or near now"
//   query induk menerima Promise sbg parameter      -> "Invalid time value"
// Jadi bug ini tidur berbulan-bulan lalu meledak karena PERUBAHAN ENV, bukan
// perubahan kode. Tidak ada gate lain di repo ini yang bisa menangkapnya.
//
// Yang benar: taruh percabangannya DI DALAM teks SQL, bukan di JavaScript —
//   VALUES (..., CASE WHEN ${isCompleted} THEN now() ELSE NULL END, ...)
// itu mengirim satu boolean biasa sebagai parameter, identik di kedua driver.
import fs from 'node:fs';
import path from 'node:path';

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.mjs')) files.push(p);
  }
})('api');

// Cari `${ ... sql` ... }` — interpolasi yang isinya memanggil tagged template sql.
// Sengaja longgar (sql`, db`, atau apa pun yang diakhiri backtick di dalam ${...}):
// yang mahal itu false negative, bukan false positive — kalau ada pola sah yang
// kena, tulis ulang query-nya, jangan longgarkan gate-nya.
const RE = /\$\{[^{}]*\b[a-zA-Z_$][\w$]*`/;

const temuan = [];
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (RE.test(line)) temuan.push({ f: f.replace(/\\/g, '/'), n: i + 1, line: line.trim().slice(0, 110) });
  });
}

if (temuan.length) {
  console.error(`Fragmen SQL tersarang di dalam parameter (${temuan.length}) — jalan di neon, MELEMPAR di postgres.js:`);
  for (const t of temuan) console.error(`  ${t.f}:${t.n}\n      ${t.line}`);
  console.error('\nPerbaiki dengan memindahkan percabangannya ke dalam SQL:');
  console.error('  CASE WHEN ${kondisi} THEN now() ELSE NULL END');
  console.error('\nAPI SQL: GAGAL');
  process.exit(1);
}
console.log(`API SQL    : ${files.length} berkas discan, 0 fragmen sql tersarang di parameter`);
