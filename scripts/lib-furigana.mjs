// lib-furigana.mjs — inti anotasi furigana bracket, dipakai DUA pemanggil:
//   scripts/gen-furigana.mjs        (kamus string → src/furigana.generated.js)
//   scripts/annotate-final-data.mjs (anotasi inline data soal asli ujian akhir)
// Dipisah supaya TERM_READINGS (kamus koreksi istilah kaigo) tidak terduplikasi —
// dua salinan pasti selisih diam-diam suatu hari.
//
// PENTING: output HARUS bracket notation `漢字[かな]`, BUKAN `<ruby>` HTML —
// renderer (src/Furigana.jsx → parseRuby) hanya mengerti bracket dan tidak memakai
// dangerouslySetInnerHTML, jadi HTML mentah tampil apa adanya ke user.

// kuroshiro mode 'furigana' menghasilkan <ruby>漢字<rp>(</rp><rt>かな</rt><rp>)</rp></ruby>.
const RUBY_TAG = /<ruby>(.*?)<rp>\(<\/rp><rt>(.*?)<\/rt><rp>\)<\/rp><\/ruby>/g;
// RUBY_RE renderer menuntut base KANJI MURNI tepat sebelum `[` — tapi kuroshiro kadang
// menganotasi token utuh berikut kana-nya (徐々に[じょじょに], お世話[おせわ]) yang tidak
// akan match dan bocor literal ke layar (kelas 3 validate-ruby). Normalisasi WAJIB di sini,
// per token, selagi batas base/reading masih pasti — di string hasil join batasnya hilang
// dan kana milik teks sebelumnya ikut tertelan. Kana tepi yang sama di base & reading
// dipindah keluar bracket; kalau base tetap campur kana (kana di tengah), anotasi token
// itu dicopot — kanji polos lebih baik daripada bocor.
const KANA_CH = /[ぁ-ゟァ-ーー]/;
function fixRubyToken(base, read) {
  let pre = '', post = '';
  while (base && KANA_CH.test(base[0]) && read.startsWith(base[0])) { pre += base[0]; base = base.slice(1); read = read.slice(1); }
  while (base && KANA_CH.test(base[base.length - 1]) && read.endsWith(base[base.length - 1])) { post = base[base.length - 1] + post; base = base.slice(0, -1); read = read.slice(0, -1); }
  if (base && read && /^[一-鿿々〆ヶ]+$/.test(base)) return `${pre}${base}[${read}]${post}`;
  return `${pre}${base}${post}`;
}
export const toBracket = (html) => html.replace(RUBY_TAG, (_, base, reading) => fixRubyToken(base, reading));

export const HAS_KANJI = /[一-鿿々〆ヶ]/;
export const BRACKETED = /[一-鿿々〆ヶ]+\[[ぁ-ゟァ-ーー]+\]/;
// bracket yang isinya bukan kana tidak bisa diparse renderer → tampil literal ke user
export const NON_KANA_BRACKET = /\[[^\]]*[^ぁ-ゟァ-ーー\]][^\]]*\]/;

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
export const TERM_READINGS = {
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
  // 造設 = ぞうせつ (pemasangan stoma/selang, mis. 胃ろうを造設). kuromoji: 造[みやつこ]設[設]
  // — みやつこ itu bacaan gelar kuno 造, dan 設 di-echo mentah (kelas 拭[拭]). Ketemu di
  // soal asli ujian 第38回 総合問題; tanpa entri ini seluruh stem kasusnya kehilangan anotasi.
  '造設': 'ぞうせつ',
  // Kanji medis di soal asli ujian yang di luar kamus inti kuromoji (di-echo mentah,
  // kelas 拭[拭]) — bacaan dari kamus istilah keperawatan standar.
  '橈骨動脈': 'とうこつどうみゃく', // nadi pergelangan; kuromoji echo 橈[橈]
  '拇指': 'ぼし',                   // ibu jari; kuromoji echo 拇[拇]
  '小弯': 'しょうわん',             // kurvatura minor lambung; kuromoji echo 弯[弯]
  '抜去': 'ばっきょ',               // pencabutan selang/tube; kuromoji: 抜[ぬ]去[さ]る dsb
  '病識': 'びょうしき',             // insight penyakit; kuromoji pisah aneh
  '膝窩': 'しっか',                 // lipat lutut (popliteal); kuromoji echo 窩[窩]
  '前脛骨筋': 'ぜんけいこつきん',   // otot tibialis anterior; kuromoji echo 脛[脛]
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
export function applyTermReadings(annotated, source) {
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

/**
 * Anotasi satu string Jepang → bracket notation, dengan seluruh guard produksi:
 * skip tanpa-kanji / sudah-bracket, tolak sisa tag HTML, koreksi istilah kaigo,
 * dan buang anotasi kalau masih ada bracket non-kana (lebih baik polos daripada bocor).
 * Return: { text, status: 'annotated'|'skipped'|'leftover'|'nonkana'|'failed', corrected }
 */
export async function annotateString(kuroshiro, text) {
  if (typeof text !== 'string' || !text || !HAS_KANJI.test(text) || BRACKETED.test(text))
    return { text, status: 'skipped', corrected: false };
  try {
    const html = await kuroshiro.convert(text, { mode: 'furigana', to: 'hiragana' });
    let bracket = toBracket(html);
    if (/<\/?(?:ruby|rt|rp|rb)\b/.test(bracket)) return { text, status: 'leftover', corrected: false };
    const fixed = applyTermReadings(bracket, text);
    const corrected = fixed !== bracket;
    bracket = fixed;
    // Bracket non-kana (拭[拭], bacaan aneh kuromoji) tidak bisa diparse renderer dan
    // bocor mentah ke layar. Dulu SELURUH string dibuang anotasinya; itu kemahalan untuk
    // stem kasus 700 karakter yang cuma punya satu bracket rusak — sekarang HANYA bracket
    // rusaknya yang dicopot (kanji itu tampil polos), sisanya tetap beranotasi.
    if (NON_KANA_BRACKET.test(bracket)) {
      bracket = bracket.replace(/\[([^\]]*)\]/g, (m, inner) => /^[ぁ-ゟァ-ーー]+$/.test(inner) ? m : '');
      return { text: bracket, status: 'annotated', corrected, sanitized: true };
    }
    return { text: bracket, status: 'annotated', corrected };
  } catch {
    return { text, status: 'failed', corrected: false };
  }
}
