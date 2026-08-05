// check-readings.mjs — cross-validasi bacaan kuromoji vs bacaan HAND-WRITTEN di glossary.json.
//
// Kenapa perlu: kuromoji itu tokenizer statistik bahasa umum, BUKAN kamus domain 介護.
// Bacaan yang salah itu bug furigana yang lebih berbahaya dari tag <ruby> bocor — tag bocor
// kelihatan jelas rusak, bacaan salah kelihatan benar tapi ngajarin bacaan keliru ke orang
// yang mau ikut ujian nasional.
//
// Cara kerja: tiap entry di furigana.generated.js diparse jadi token (base, reading).
// Untuk tiap term glossary, cari kemunculan `kanji` di string sumber, lalu ambil bacaan
// yang kuromoji kasih untuk RENTANG kanji itu. Cuma dibandingkan kalau rentangnya PAS di
// batas token — kalau kanji-nya cuma sebagian dari token yang lebih panjang (misal 生活 di
// dalam token 生活歴), itu bukan mismatch, itu konteks beda. Dilaporkan terpisah.
//
// Jalanin: node scripts/qa/check-readings.mjs
import { furiganaMap } from '../../src/furigana.generated.js';
import glossary from '../../src/content/glossary.json' with { type: 'json' };

const RUBY_RE = /([一-鿿々〆ヶ]+)\[([ぁ-ゟァ-ーー]+)\]/g;
const HAS_KANJI = /[一-鿿々〆ヶ]/;
const kata2hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const norm = (s) => kata2hira(String(s || '')).trim();

/** Pecah string beranotasi jadi token berurutan; `at` = offset token di string ASLI (tanpa bracket). */
function tokenize(annotated) {
  const out = [];
  let last = 0, plainLen = 0, m;
  RUBY_RE.lastIndex = 0;
  while ((m = RUBY_RE.exec(annotated)) !== null) {
    if (m.index > last) {
      const t = annotated.slice(last, m.index);
      out.push({ base: t, rt: null, at: plainLen });
      plainLen += t.length;
    }
    out.push({ base: m[1], rt: m[2], at: plainLen });
    plainLen += m[1].length;
    last = m.index + m[0].length;
  }
  if (last < annotated.length) {
    const t = annotated.slice(last);
    out.push({ base: t, rt: null, at: plainLen });
  }
  return out;
}

const terms = (glossary.terms || glossary).filter((t) => HAS_KANJI.test(t.kanji));
const findings = new Map(); // slug -> {agree, mismatches:Map(reading -> {count, samples}), partial}

for (const t of terms) findings.set(t.slug, { term: t, agree: 0, mismatches: new Map(), partial: 0 });

for (const [source, annotated] of Object.entries(furiganaMap)) {
  const toks = tokenize(annotated);
  // sanity: rekonstruksi harus sama dengan sumber, kalau tidak parsing-nya salah
  if (toks.map((x) => x.base).join('') !== source) { console.error(`PARSE MISMATCH: ${source}`); continue; }
  for (const t of terms) {
    let idx = source.indexOf(t.kanji);
    while (idx !== -1) {
      const end = idx + t.kanji.length;
      const covering = toks.filter((x) => x.at < end && x.at + x.base.length > idx);
      const aligned = covering.length && covering[0].at === idx && covering[covering.length - 1].at + covering[covering.length - 1].base.length === end;
      const f = findings.get(t.slug);
      if (!aligned) f.partial++;
      else if (covering.some((x) => x.rt === null)) f.partial++; // ada bagian tanpa bacaan (kana/angka)
      else {
        const got = norm(covering.map((x) => x.rt).join(''));
        if (got === norm(t.reading)) f.agree++;
        else {
          if (!f.mismatches.has(got)) f.mismatches.set(got, { count: 0, samples: [] });
          const e = f.mismatches.get(got);
          e.count++;
          if (e.samples.length < 2) e.samples.push(source);
        }
      }
      idx = source.indexOf(t.kanji, idx + 1);
    }
  }
}

const bad = [...findings.values()].filter((f) => f.mismatches.size);
console.log(`Glossary terms with kanji: ${terms.length}`);
console.log(`Terms where kuromoji DISAGREES with hand-written reading: ${bad.length}\n`);
for (const f of bad.sort((a, b) => [...b.mismatches.values()].reduce((s, x) => s + x.count, 0) - [...a.mismatches.values()].reduce((s, x) => s + x.count, 0))) {
  const total = [...f.mismatches.values()].reduce((s, x) => s + x.count, 0);
  console.log(`${f.term.kanji}  hand="${f.term.reading}"  agree=${f.agree} mismatch=${total} partial=${f.partial}`);
  for (const [got, e] of [...f.mismatches.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`   kuromoji="${got}" x${e.count}`);
    for (const s of e.samples) console.log(`      ctx: ${s.slice(0, 78)}`);
  }
}

// kanji multi-bacaan yang diminta dicek eksplisit (音読み vs 訓読み gampang ketuker)
const WATCH = ['行う', '分ける', '生活', '大切', '一人', '二人', '三つ', '何', '上', '下', '中', '間', '方', '目', '気', '体', '心'];
console.log('\n--- WATCHLIST: sebaran bacaan per kanji (bukan otomatis salah, buat inspeksi manual) ---');
for (const w of WATCH) {
  const tally = new Map();
  for (const [source, annotated] of Object.entries(furiganaMap)) {
    if (!source.includes(w)) continue;
    for (const tok of tokenize(annotated)) {
      if (tok.rt && tok.base === w) tally.set(tok.rt, (tally.get(tok.rt) || 0) + 1);
    }
  }
  if (tally.size) console.log(`${w}: ${[...tally.entries()].sort((a, b) => b[1] - a[1]).map(([r, c]) => `${r}(${c})`).join(' ')}`);
  else console.log(`${w}: — tidak muncul sebagai token utuh`);
}
