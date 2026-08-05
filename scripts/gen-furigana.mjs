// One-off script: precompute furigana for every unique Japanese string used in the
// app, then write it as a static lookup map into src/furigana.generated.js.
// Runtime app never loads kuromoji — it just imports the precomputed map.
// Run manually: node scripts/gen-furigana.mjs
//
// PENTING: output HARUS bracket notation `漢字[かな]`, BUKAN `<ruby><rt>` HTML.
// Renderer (src/Furigana.jsx -> parseRuby) hanya mengerti bracket notation dan tidak
// memakai dangerouslySetInnerHTML, jadi HTML mentah akan tampil apa adanya ke user.
import KuroshiroImport from 'kuroshiro';
import KuromojiAnalyzerImport from 'kuroshiro-analyzer-kuromoji';
import { sections } from '../src/data.js';
import s1l1Ja from '../src/content/s1l1-ja.json' with { type: 'json' };
import s1l1 from '../src/content/s1l1.json' with { type: 'json' };
import glossary from '../src/content/glossary.json' with { type: 'json' };
import finalData from '../src/content/final/index.js';
import { writeFileSync } from 'node:fs';

const Kuroshiro = KuroshiroImport.default || KuroshiroImport;
const KuromojiAnalyzer = KuromojiAnalyzerImport.default || KuromojiAnalyzerImport;

const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer());

const HAS_KANJI = /[一-鿿々〆ヶ]/;
const BRACKETED = /[一-鿿々〆ヶ]+\[[ぁ-ゟァ-ーー]+\]/;

const strings = new Set();
const add = (v) => {
  // Hanya string yang mengandung kanji perlu furigana. Yang sudah beranotasi manual
  // (s1l1.json) dilewati — anotasi tangan lebih akurat dari kuromoji.
  if (typeof v !== 'string' || !v) return;
  if (!HAS_KANJI.test(v) || BRACKETED.test(v)) return;
  strings.add(v);
};

// Kumpulkan SEMUA teks Jepang, termasuk field datar (questionJa/choices/explanationJa/
// titleJa/objective) yang versi lama dilewatkan karena langsung `return` pada string.
const JA_KEYS = new Set(['ja','questionJa','explanationJa','titleJa','objective','description','q','explanation','meaning','when','prompt','scenario','reveal','note','heading','body','text','kanji']);
function walk(value, key) {
  if (typeof value === 'string') { if (key === undefined || JA_KEYS.has(key) || key === 'choices') add(value); return; }
  if (Array.isArray(value)) { value.forEach((v) => walk(v, key)); return; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'id' || k === 'romaji' || k === 'reading' || k === 'slug' || k === 'en') continue; // bukan teks Jepang berkanji
      walk(v, k);
    }
  }
}
walk(sections);
walk(s1l1Ja);
walk(s1l1);
walk(glossary.terms || glossary);
walk(finalData);
// choiceIds itu bahasa Indonesia; choices itu Jepang — pastikan choices ikut terkumpul.
for (const s of sections) for (const l of s.levels) for (const q of l.questions) q.choices.forEach(add);

console.log(`Generating furigana for ${strings.size} unique strings...`);

// kuroshiro mode 'furigana' menghasilkan <ruby>漢字<rp>(</rp><rt>かな</rt><rp>)</rp></ruby>.
// Kita ubah jadi 漢字[かな] supaya bisa diparse renderer.
const RUBY_TAG = /<ruby>(.*?)<rp>\(<\/rp><rt>(.*?)<\/rt><rp>\)<\/rp><\/ruby>/g;
const toBracket = (html) => html.replace(RUBY_TAG, (_, base, reading) => `${base}[${reading}]`);

// ─────────────────────────────────────────────────────────────────────────────
// KAMUS KOREKSI ISTILAH 介護.
//
// kuromoji itu tokenizer statistik bahasa umum, BUKAN kamus domain perawatan. Untuk
// istilah kaigo dia sering salah baca, dan bacaan salah LEBIH BAHAYA dari tag <ruby>
// bocor: tag bocor kelihatan jelas rusak, bacaan salah kelihatan benar tapi ngajarin
// bacaan keliru ke orang yang mau ikut ujian nasional 介護福祉士.
//
// Semua koreksi di bawah diverifikasi terhadap `reading` HAND-WRITTEN di
// src/content/glossary.json (otoritatif) — lihat scripts/qa/check-readings.mjs.
// Kunci diurutkan dari yang TERPANJANG dulu saat diterapkan, supaya 経鼻経管栄養
// menang sebelum 経鼻, dan 誤嚥 menang sebelum 嚥下.
//
// FORMAT NILAI — dua bentuk yang diterima:
//   1. kana saja       -> jadi SATU grup ruby: `istilah[kana]`
//   2. sudah ada `[`   -> dipakai APA ADANYA, untuk istilah yang harus jadi >1 grup ruby
// Bentuk 2 wajib dipakai kalau istilahnya berakhir hiragana (mis. 一人歩き): RUBY_RE di
// src/Furigana.jsx menuntut kanji TEPAT sebelum `[`, jadi `一人歩き[ひとりあるき]` (base
// berakhir き) tidak akan match dan bracket-nya bocor mentah ke layar user — itu KELAS 3
// di scripts/validate-ruby.mjs. Pecah jadi `一人[ひとり]歩[ある]き` supaya tiap grup sah.
const TERM_READINGS = {
  // Salah baca 音読み/訓読み — kuromoji pilih bacaan umum, bukan bacaan istilah medis.
  '嚥下': 'えんげ',                 // kuromoji: えんか  (glossary: えんげ)
  '誤嚥': 'ごえん',                 // kuromoji: あやまえん — 誤 dibaca kata kerja あやま
  '褥瘡': 'じょくそう',             // kuromoji: しとねくさ — dua-duanya 訓読み, jauh dari istilah klinis
  '口腔': 'こうくう',               // kuromoji: こうこう — bacaan medis 腔 = くう
  '自己覚知': 'じこかくち',         // kuromoji: じこさとしち — 覚 jadi さとし (nama orang)
  '残存機能': 'ざんぞんきのう',     // kuromoji: ざんそんきのう — 存 di sini ぞん
  '前頭側頭型認知症': 'ぜんとうそくとうがたにんちしょう', // kuromoji: まえがしらがわあたまがた…
  '経鼻経管栄養': 'けいびけいかんえいよう',               // kuromoji: けいはなけいかんえいよう
  // ベッド柵 = pagar/pengaman tempat tidur, dibaca さく. kuromoji pilih 訓読み しがらみ yang
  // artinya "belenggu/ikatan sosial" — sama sekali tidak relevan, DAN satu-satunya entry yang
  // memakainya adalah soal tentang 身体拘束 (pengekangan fisik), di mana 柵 justru inti materinya.
  // Bacaan salah di sini bukan cuma jelek, tapi ngajarin istilah keliru di topik ujian.
  '柵': 'さく',                     // kuromoji: しがらみ
  // 認知症 itu SATU istilah (glossary slug ninchishou = にんちしょう), tapi kuromoji selalu
  // memecahnya jadi 認知[にんち] + 症[しょう] = dua grup ruby, tampil 認知|症. Bacaannya tidak
  // salah, tapi user harus mengenalinya sebagai satu kata, bukan dua. Dipakai di 80+ entry.
  '認知症': 'にんちしょう',         // kuromoji: 認知[にんち]症[しょう] (terpecah)
  // Sengaja TIDAK ditambahkan sebagai key: 血管性認知症, 若年性認知症, アルツハイマー型認知症.
  // Bacaan per-morfem dari kuromoji (血管[けっかん]性[せい] / 若年[じゃくねん]性[せい] / 型[がた])
  // sudah benar, dan key 認知症 di atas sudah menyatukan bagian yang terpecah. Menjadikannya
  // satu grup 5-6 kanji hanya memperbesar risiko layout ruby tanpa manfaat bacaan.
  //
  // Kuromoji mengembalikan KANJI-nya sendiri sebagai "bacaan" (mis. 拭[拭]) karena kanji
  // di luar kamus intinya. Bracket berisi non-kana tidak bisa diparse renderer, jadi
  // tampil literal "拭[拭]" ke user — kelas bug yang sama dengan tag bocor.
  '清拭': 'せいしき',               // kuromoji: 清[きよし]拭[拭]
  '見当識': 'けんとうしき',         // kuromoji: 見当[けんとう]識[識]. JANGAN tambahkan
  // 見当識障害 sebagai key terpisah: 見当識 sudah menangani bagian yang salah, dan key
  // yang tumpang-tindih bikin pass kedua menimpa 障害 dengan bacaan istilah penuh
  // (jadi 見当識[けんとうしき]障害[けんとうしきしょうがい]). 障害 sendiri sudah benar dari kuromoji.
  '協働': 'きょうどう',             // kuromoji: 協[きょう]働[働]
  // Bacaan 熟字訓 / kata asli yang tidak bisa disusun dari bacaan per-kanji.
  // 一人歩き = ひとりあるき. kuromoji: 一[いち]人[にん]歩[ある]き — いちにん itu bacaan
  // hitungan orang formal, bukan untuk 一人歩き. Istilah ini inti di materi 身体拘束/自立支援
  // (「安全だけを優先して一人歩きを禁止するのではなく」), jadi salahnya kena tepat di konsepnya.
  // Ditulis 2 grup: base grup terakhir harus kanji, tidak boleh berakhir き (lihat FORMAT NILAI).
  '一人歩き': '一人[ひとり]歩[ある]き',
  // 三日目 = みっかめ (hitungan hari pakai bacaan asli). kuromoji: 三[さん]日[にち]目[め].
  // Konteks: 「これで三日目です」(kartu 入浴拒否 佐藤さん). さんにちめ salah.
  '三日目': 'みっかめ',
};
const TERM_KEYS = Object.keys(TERM_READINGS).sort((a, b) => b.length - a.length);

/**
 * Timpa anotasi kuromoji untuk istilah kaigo yang bacaannya sudah kita pastikan.
 * Dijalankan SETELAH toBracket: cari istilah di teks yang sudah beranotasi, buang
 * anotasi per-kanji yang salah di dalam rentang istilah, ganti satu bracket yang benar.
 *
 * PENTING — kenapa pakai penanda rentang, bukan replace berantai:
 * banyak key itu SUBSTRING dari key lain (認知症 ⊂ 前頭側頭型認知症, 見当識 ⊂ 見当識障害).
 * Kalau tiap key di-replace langsung ke string yang sama, key pendek yang diproses belakangan
 * akan mencocokkan ULANG hasil key panjang dan menimpanya:
 *   前頭側頭型認知症[ぜんとうそくとうがたにんちしょう] -> 前頭側頭型認知症[にんちしょう]  (SALAH)
 * Jadi setiap istilah yang sudah diselesaikan dikunci ke placeholder \x00n\x00 yang tidak bisa
 * dicocokkan pola kanji apa pun, lalu diekspansi di akhir. Efeknya: match paling panjang menang
 * dan aman ditambah entry baru nanti tanpa mikir urutan/tumpang-tindih.
 * Penguncian ini juga yang bikin 一人歩き / 三日目 aman dari key pendek (一 / 三 / 日 / 目 /
 * 一人) kalau nanti key itu ditambahkan: begitu tersubstitusi, isinya atomik.
 */
function applyTermReadings(annotated, source) {
  let out = annotated;
  const locked = [];
  for (const term of TERM_KEYS) {
    if (!source.includes(term)) continue;
    // Nilai boleh sudah beranotasi (>1 grup ruby) atau kana saja (1 grup) — lihat FORMAT NILAI.
    const replacement = TERM_READINGS[term].includes('[') ? TERM_READINGS[term] : `${term}[${TERM_READINGS[term]}]`;
    // pola: tiap kanji istilah boleh punya bracket sendiri (協[きょう]働[働]) atau tanpa bracket
    const pattern = term.split('').map((ch) => `${ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\[[^\\]]*\\])?`).join('');
    out = out.replace(new RegExp(pattern, 'g'), () => {
      locked.push(replacement);
      return `\x00${locked.length - 1}\x00`;
    });
  }
  return out.replace(/\x00(\d+)\x00/g, (_, i) => locked[Number(i)]);
}

const map = {};
let done = 0, failed = 0, leftover = 0, corrected = 0, nonKana = 0;
// bracket yang isinya bukan kana tidak bisa diparse renderer -> tampil literal ke user
const NON_KANA_BRACKET = /\[[^\]]*[^ぁ-ゟァ-ーー\]][^\]]*\]/;
for (const text of strings) {
  try {
    const html = await kuroshiro.convert(text, { mode: 'furigana', to: 'hiragana' });
    let bracket = toBracket(html);
    if (/<\/?(?:ruby|rt|rp|rb)\b/.test(bracket)) { leftover++; map[text] = text; continue; } // jangan pernah kirim tag ke renderer
    const fixed = applyTermReadings(bracket, text);
    if (fixed !== bracket) corrected++;
    bracket = fixed;
    // Guard terakhir: kalau masih ada bracket non-kana, buang anotasinya untuk string itu.
    // Lebih baik tampil kanji tanpa bacaan daripada bocor "拭[拭]" ke user.
    if (NON_KANA_BRACKET.test(bracket)) { nonKana++; console.warn(`  NON-KANA bracket, annotation dropped: ${text.slice(0, 40)}`); map[text] = text; }
    else map[text] = bracket;
  } catch {
    map[text] = text;
    failed++;
  }
  done++;
  if (done % 100 === 0) console.log(`  ${done}/${strings.size}`);
}

const out = `// AUTO-GENERATED by scripts/gen-furigana.mjs — do not edit by hand.
// Maps: original Japanese string -> string beranotasi bracket notation 漢字[かな].
// JANGAN ubah ke <ruby> HTML: renderer (src/Furigana.jsx) memparse bracket, tidak pakai innerHTML.
export const furiganaMap = ${JSON.stringify(map, null, 0)};
export const furigana = (text) => furiganaMap[text] || text;
`;

writeFileSync(new URL('../src/furigana.generated.js', import.meta.url), out);
console.log(`Done. Wrote ${Object.keys(map).length} entries (${failed} conversion failures, ${leftover} with leftover tags, ${corrected} kaigo-term corrections, ${nonKana} dropped for non-kana brackets) to src/furigana.generated.js`);
