// build-glossary-from-final.mjs — tambahkan istilah dari bank soal asli ke glossary.
//
//   node scripts/build-glossary-from-final.mjs <arti1.json> [arti2.json ...]
//
// Argumen = berkas {kanji: "arti Indonesia"} yang ditulis manusia. Sisanya diturunkan
// dari DATA, bukan ditebak:
//   reading  — dari anotasi furigana bracket di src/content/final/data/*.json, jadi
//              bacaannya persis yang dipakai di soal (bukan tebakan kuromoji ulang).
//   romaji   — kanaToRomaji(reading), sumber yang sama dengan gate validate:romaji.
//   sections — mapel resmi soal tempat istilah itu muncul, dipetakan ke 13 bab app.
//   examples — kalimat ASLI dari soal yang memuat istilah itu (dipilih yang terpendek
//              supaya muat di kartu), berikut terjemahan Indonesianya. Ini yang membuat
//              entri baru tidak berbunyi seperti template: contohnya kalimat ujian nyata.
// Entri yang kanji-nya sudah ada di glossary.json TIDAK disentuh.
import { readFileSync, writeFileSync } from 'node:fs';
import { kanaToRomaji } from '../src/lib/kana.js';

const SUBJ = { '人間の尊厳と自立': 1, '人間関係とコミュニケーション': 2, '社会の理解': 3, 'こころとからだのしくみ': 4, '発達と老化の理解': 5, '認知症の理解': 6, '障害の理解': 7, '医療的ケア': 8, '介護の基本': 9, 'コミュニケーション技術': 10, '生活支援技術': 11, '介護過程': 12, '総合問題': 13 };
const SECTION_TAG = { 1: 'fondasi', 2: 'komunikasi', 3: 'sistem', 4: 'kesehatan', 5: 'penuaan', 6: 'demensia', 7: 'disabilitas', 8: 'medis', 9: 'fondasi', 10: 'komunikasi', 11: 'teknik', 12: 'proses', 13: 'kasus' };
const RUBY = /([一-鿿々〆ヶ]+)\[([ぁ-ゟァ-ーー]+)\]/g;
// Regex TERPISAH untuk strip: RUBY dipakai sebagai iterator ber-lastIndex di loop
// while di bawah, dan .replace() pada regex yang SAMA mereset lastIndex-nya ke 0 —
// loop while-nya lalu tidak pernah selesai (hang, bukan error).
const stripRuby = (s) => String(s || '').replace(/([一-鿿々〆ヶ]+)\[([ぁ-ゟァ-ーー]+)\]/g, '$1');

const artiFiles = process.argv.slice(2);
if (!artiFiles.length) { console.error('usage: node scripts/build-glossary-from-final.mjs <arti.json> ...'); process.exit(1); }
const arti = Object.assign({}, ...artiFiles.map(f => JSON.parse(readFileSync(f, 'utf8'))));

const gPath = new URL('../src/content/glossary.json', import.meta.url);
const g = JSON.parse(readFileSync(gPath, 'utf8'));
const terms = g.terms || g;
const adaKanji = new Set(terms.map(t => t.kanji));
const adaSlug = new Set(terms.map(t => t.slug));

// Kumpulkan reading, frekuensi, mapel, dan kalimat contoh untuk tiap istilah.
const info = new Map();
for (const year of [2021, 2022, 2023, 2024, 2025, 2026]) {
  const d = JSON.parse(readFileSync(new URL(`../src/content/final/data/${year}.json`, import.meta.url), 'utf8'));
  for (const q of d.questions) {
    const sec = SUBJ[q.subject] || 13;
    const pasangan = [[q.prompt.ja, q.prompt.id], ...q.options.map(o => [o.text.ja, o.text.id])];
    for (const [ja, id] of pasangan) {
      let m; RUBY.lastIndex = 0;
      while ((m = RUBY.exec(ja)) !== null) {
        const kanji = m[1], reading = m[2];
        if (kanji.length < 2 || kanji.length > 7) continue;
        if (!arti[kanji] || adaKanji.has(kanji)) continue;
        if (!info.has(kanji)) info.set(kanji, { readings: new Map(), secs: new Map(), contoh: [] });
        const e = info.get(kanji);
        e.readings.set(reading, (e.readings.get(reading) || 0) + 1);
        e.secs.set(sec, (e.secs.get(sec) || 0) + 1);
        // Contoh: kalimat pendek, punya terjemahan, dan bukan blok kasus panjang.
        const polos = stripRuby(ja);
        if (polos.length <= 46 && id && id.length <= 130 && !polos.includes('\n')) e.contoh.push({ ja, id });
      }
    }
  }
}

const baru = [];
for (const [kanji, e] of info) {
  const reading = [...e.readings.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const romaji = kanaToRomaji(reading);
  // Slug harus unik di seluruh glossary: romaji dulu, lalu -2, -3, … bila bentrok.
  let slug = romaji.replace(/[^a-z0-9]/g, '');
  if (!slug) continue;
  let n = 2; const dasar = slug;
  while (adaSlug.has(slug)) slug = `${dasar}${n++}`;
  adaSlug.add(slug);
  const short = arti[kanji];
  const secs = [...e.secs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]).sort((a, b) => a - b);
  const contoh = e.contoh.sort((a, b) => stripRuby(a.ja).length - stripRuby(b.ja).length)[0];
  const jumlah = [...e.secs.values()].reduce((a, b) => a + b, 0);
  const long = `${kanji} (${reading}) berarti ${short}. Istilah ini muncul ${jumlah} kali di soal ujian nasional 介護福祉士 tahun 2021–2026 yang ada di aplikasi ini, terutama pada mapel ${secs.map(s => Object.keys(SUBJ).find(k => SUBJ[k] === s)).join(', ')}. Baca artinya bersama kalimat contoh di bawah: memahami istilah lewat kalimat utuh jauh lebih bertahan daripada menghafal terjemahan satu kata.`;
  baru.push({
    slug, kanji, reading, romaji,
    id: { short, long },
    type: 'kango', sections: secs, tags: [...new Set(secs.map(s => SECTION_TAG[s]))],
    examples: contoh ? [{ ja: contoh.ja, id: contoh.id }] : [],
    related: [], status: 'ready', occurrences: 0, en: short, synonyms: [],
    source: 'exam-2021-2026',
  });
}

baru.sort((a, b) => a.slug.localeCompare(b.slug));
const out = { ...(g.terms ? g : {}), terms: [...terms, ...baru] };
writeFileSync(gPath, JSON.stringify(g.terms ? out : out.terms, null, 2) + '\n');
console.log(`glossary: ${terms.length} lama + ${baru.length} baru = ${terms.length + baru.length} istilah`);
console.log(`  tanpa contoh: ${baru.filter(b => !b.examples.length).length}`);
