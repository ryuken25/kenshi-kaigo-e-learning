// Cari class yang dipakai di JSX tapi NOL rule di semua CSS. Kelas bug ini sudah kejadian
// berkali-kali di repo (seluruh halaman Ujian Akhir, .termSheetBackdrop, .sr-only,
// .finalHomeBanner) dan akibatnya selalu sama: elemen jatuh ke display:inline, jadi
// <b>/<span>/<small> nempel jadi satu baris teks — persis yang kelihatan sebagai
// "Ujian AkhirSimulasi 2021-2026 - 125 soal per tahun".
//
// Build tidak pernah gagal karena ini: class yang tidak punya rule itu sah-sah saja di CSS.
import fs from 'node:fs';

const cssText = ['src/styles.css','src/routing.css','src/translation.css','src/auth.css','src/themes.css','src/social.css']
  .filter(f=>fs.existsSync(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');

// Kumpulkan semua selector class yang benar-benar dideklarasikan.
// Batas kanan WAJIB: tanpa itu `.finalHomeBannerXX` ikut mendaftarkan `finalHomeBanner`,
// dan gate-nya jadi lulus palsu (kebukti waktu sabotage test — rule dihapus, gate tetap hijau).
// Karakter yang sah MENGAKHIRI nama class: { , . : # [ > + ~ spasi ) newline
const declared = new Set();
for (const m of cssText.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)(?=[\s{,.:#[>+~)]|$)/gm)) declared.add(m[1]);

const used = new Map(); // class -> file:line
for (const f of fs.readdirSync('src').filter(x=>/\.jsx$/.test(x))) {
  const lines = fs.readFileSync('src/'+f,'utf8').split('\n');
  lines.forEach((line,i)=>{
    // className="a b c" dan className={`a ${x} b`} dan className={'a'}
    for (const m of line.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)) {
      const raw = (m[1]||m[2]||m[3]||'');
      for (const c of raw.split(/[\s${}?:'"()+]+/)) {
        if (!c || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(c)) continue;
        if (!used.has(c)) used.set(c, `src/${f}:${i+1}`);
      }
    }
  });
}

// Nama yang muncul dari parsing template literal / ternary, BUKAN class sungguhan
// (mis. `${variantClass}`, `size-${x}`, `${clickable?'is-term':''}`), plus wrapper
// tingkat halaman yang memang sengaja tanpa style (cuma penanda buat scoping).
const ABAIKAN = new Set([
  'variantClass','className','size','size-','rich-','clickable','isMilestone','previewOnly',
  'isCurrent','correct','lesson','themeDotClass',
  // wrapper halaman: dipakai sebagai penanda/scoping, styling-nya lewat .page
  'finalPage','finalQuiz','unlimitedFinal','glossaryPage','materiPage','profile',
]);

const missing = [...used].filter(([c])=>!declared.has(c) && !ABAIKAN.has(c));
if (missing.length) {
  console.error(`Class tanpa rule CSS (${missing.length}) — elemen jatuh ke display:inline:`);
  for (const [c,loc] of missing) console.error(`  .${c.padEnd(24)} ${loc}`);
  console.error('\nCSS class: GAGAL');
  process.exit(1);
}
console.log(`CSS class  : ${used.size} class dipakai di JSX, semua punya rule`);
