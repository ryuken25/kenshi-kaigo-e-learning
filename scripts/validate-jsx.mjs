// Gerbang anti "identifier JSX telanjang". Kelas bug yang SUDAH bikin produksi mati total:
// main.jsx pakai <UnlimitedFinal/> di route tapi lupa masukin namanya ke daftar import.
//
// KENAPA BUILD TIDAK BISA NANGKEP INI: `element={<Foo/>}` itu sah secara sintaks walau Foo
// nggak dideklarasi — JS ngizinin free variable (bisa saja global seperti window.Foo), jadi
// bundler emit apa adanya dan `npm run build` exit 0. Yang meledak cuma saat runtime:
// ReferenceError dilempar waktu array children <Routes> DIBANGUN, bukan waktu route-nya
// match. Jadi seluruh route tree gagal terbentuk — termasuk "/" — dan karena nol error
// boundary di src/, React unmount semuanya jadi HALAMAN PUTIH di SEMUA url.
//
// Pengecekan: tiap <NamaKapital/> yang dipakai di JSX harus punya deklarasi di file yang sama,
// entah lewat import, function/const/class, atau prop rename `as:Tag`.
// Dijalankan lewat `npm run validate:jsx`.
import fs from 'node:fs';

const files=fs.readdirSync('src').filter(f=>/\.jsx$/.test(f));
let total=0,checked=0;
for(const f of files){
  const src=fs.readFileSync('src/'+f,'utf8');
  const used=new Set([...src.matchAll(/<([A-Z][A-Za-z0-9_]*)[\s/>]/g)].map(m=>m[1]));
  const declared=new Set();
  for(const m of src.matchAll(/(?:function|const|let|class)\s+([A-Z][A-Za-z0-9_]*)/g))declared.add(m[1]);
  for(const m of src.matchAll(/as:([A-Z][A-Za-z0-9_]*)/g))declared.add(m[1]); // <Tag> dari prop `as`
  for(const m of src.matchAll(/import\s+([^;]+?)\s+from/g))for(const n of m[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)/g))declared.add(n[1]);
  const miss=[...used].filter(u=>!declared.has(u));
  checked+=used.size;
  if(miss.length){console.error(`src/${f} — identifier JSX tak terdeklarasi: ${miss.join(', ')}`);total+=miss.length}
}
if(total){console.error(`\nJSX valid: GAGAL — ${total} identifier tak terdeklarasi (produksi bakal white-screen)`);process.exit(1)}
console.log(`JSX valid  : ${files.length} file, ${checked} pemakaian komponen, 0 identifier tak terdeklarasi`);
