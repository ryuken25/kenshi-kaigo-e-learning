// Gerbang anti-bocor notasi bracket. Tiga kelas bug yang SUDAH pernah kejadian di repo ini,
// semuanya bermuara ke satu akibat yang sama: teks mentah "[かな]" kelihatan di layar user.
//
// RUBY_RE di src/Furigana.jsx cuma match `(kanji)+[(kana)+]`. Apapun yang niatnya jadi ruby
// tapi tidak memenuhi bentuk itu TIDAK dirender jadi ruby — dia lolos sebagai teks biasa,
// lengkap dengan bracket-nya. Tidak ada innerHTML di app ini, jadi tidak ada jaring pengaman.
//
// KELAS 1 — tag HTML ruby di dalam map (bug asli): generator dulu keluarin `<ruby><rt>…`,
//           parser cuma ngerti bracket, jadi tag-nya tampil verbatim.
// KELAS 2 — bracket berisi NON-KANA, mis. `拭[拭]` / `識[識]`: kuromoji sesekali balikin
//           kanji-nya sendiri sebagai "bacaan". Tidak match RUBY_RE -> bocor.
// KELAS 3 — base BUKAN kanji, mis. `1[ひと]つ` (angka ASCII): base harus kanji, angka tidak.
//           Perbaikannya di KONTEN (1 -> 一), BUKAN dengan melonggarkan RUBY_RE — kalau regex
//           dilonggarkan sampai nerima angka, anotasi rusak lain justru ikut lolos diam-diam.
//
// Dijalankan lewat `npm run validate:ruby`. Build tidak bisa nangkap ini.
import fs from 'node:fs';

const FILES=['src/content/s1l1.json','src/content/s1l1-ja.json','src/content/glossary.json','src/furigana.generated.js','src/data.js','src/content/final/index.js'];
const KANJI=/[一-鿿々〆ヶ]/;
const KANA_ONLY=/^[ぁ-ゟ゠-ヿーｰ]+$/;
const BRACKET=/\[([^\]]{1,24})\]/g;
const HTML_RUBY=/<\/?(?:ruby|rt|rp|rb)\b/gi;

const errors=[];let scanned=0,rubySites=0;

for(const f of FILES){
  if(!fs.existsSync(f))continue;
  const text=fs.readFileSync(f,'utf8');scanned++;

  // KELAS 1: tag HTML ruby. Furigana.jsx & furigana.generated.js menyebut tag ini di
  // komentar/dokumentasi, jadi baris komentar JS dilewati — yang dicari tag di data.
  const lines=text.split('\n');
  lines.forEach((line,i)=>{
    if(/^\s*(\/\/|\*|\/\*)/.test(line))return;
    HTML_RUBY.lastIndex=0;
    if(HTML_RUBY.test(line))errors.push(`${f}:${i+1} KELAS 1 — tag HTML ruby di data: ${line.trim().slice(0,90)}`);
  });

  BRACKET.lastIndex=0;let m;
  while((m=BRACKET.exec(text))!==null){
    const inner=m[1],prev=text[m.index-1]||'';
    const prevIsKanji=KANJI.test(prev);
    // KELAS 2: didahului kanji (jadi JELAS niatnya anotasi ruby) tapi isinya bukan kana murni.
    if(prevIsKanji&&!KANA_ONLY.test(inner)){
      errors.push(`${f} KELAS 2 — bracket bukan kana murni: …${text.slice(Math.max(0,m.index-10),m.index+m[0].length+3).replace(/\n/g,'\\n')}…`);
      continue;
    }
    if(!KANA_ONLY.test(inner))continue; // bracket biasa (mis. array JS), bukan anotasi
    // KELAS 3: isinya kana murni (niat jadi ruby) tapi base-nya bukan kanji -> tidak akan match.
    if(!prevIsKanji){
      errors.push(`${f} KELAS 3 — base bracket bukan kanji ("${prev}"): …${text.slice(Math.max(0,m.index-12),m.index+m[0].length+4).replace(/\n/g,'\\n')}…`);
      continue;
    }
    rubySites++;
  }
}

if(errors.length){console.error(errors.slice(0,40).join('\n'));if(errors.length>40)console.error(`… +${errors.length-40} lagi`);console.error(`\nRuby valid: GAGAL — ${errors.length} bracket bocor`);process.exit(1)}
console.log(`Ruby valid : ${scanned} file discan, ${rubySites} anotasi ruby sah, 0 bocor (kelas 1/2/3 bersih)`);
