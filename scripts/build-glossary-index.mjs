#!/usr/bin/env node
// build-glossary-index.mjs
// Pindai seluruh konten, hitung tiap istilah muncul di berapa soal & materi,
// tulis glossary.index.json yang dipakai buat Top 10 + bagian "Muncul di".
//
// package.json:  "prebuild": "node scripts/build-glossary-index.mjs && node scripts/validate-glossary.mjs"

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SECTIONS_DIR = 'src/content/sections';
const GLOSSARY     = 'src/content/glossary.json';
const OUT          = 'src/content/glossary.index.json';

const RUBY_RE = /([\u4E00-\u9FFF\u3005\u3006\u30F6]+)\[([\u3041-\u309F\u30A1-\u30FCー]+)\]/g;

const doc = JSON.parse(await readFile(GLOSSARY, 'utf8'));
const terms = doc.terms ?? doc;

// peta kanji → entri, diurutkan dari yang terpanjang
// supaya 地域包括ケアシステム cocok duluan sebelum 地域
const byKanji = new Map(terms.map((t) => [t.kanji, t]));
const kanjiSorted = [...byKanji.keys()].sort((a, b) => b.length - a.length);

const stats = new Map(terms.map((t) => [t.slug, {
  occurrences: 0,
  sections: new Set(),
  levels: [],
  questionIds: new Set(),
}]));

/** Cocokkan kata terpanjang dulu — 尊厳 tidak boleh pecah jadi 尊 + 厳. */
function findTerms(text) {
  if (!text) return [];
  const plain = String(text).replace(RUBY_RE, '$1');
  const found = new Set();
  for (const k of kanjiSorted) {
    if (plain.includes(k)) found.add(k);
  }
  return [...found];
}

function collectText(obj, bag = []) {
  if (typeof obj === 'string') bag.push(obj);
  else if (Array.isArray(obj)) obj.forEach((v) => collectText(v, bag));
  else if (obj && typeof obj === 'object') Object.values(obj).forEach((v) => collectText(v, bag));
  return bag;
}

function record(kanji, sectionId, levelId, qid) {
  const entry = byKanji.get(kanji);
  if (!entry) return;
  const s = stats.get(entry.slug);
  s.occurrences += 1;
  s.sections.add(sectionId);
  if (!s.levels.some((l) => l.section === sectionId && l.level === levelId)) {
    s.levels.push({ section: sectionId, level: levelId });
  }
  if (qid) s.questionIds.add(qid);
}

let files = [];
try { files = (await readdir(SECTIONS_DIR)).filter((f) => f.endsWith('.json')).sort(); } catch { /* generated app content has no sections directory */ }

if (files.length) for (const file of files) {
  const data = JSON.parse(await readFile(join(SECTIONS_DIR, file), 'utf8'));
  const s = data.sectionId;

  for (const lv of data.levels ?? []) {
    // materi
    for (const card of lv.materi ?? []) {
      for (const txt of collectText(card)) {
        for (const k of findTerms(txt)) record(k, s, lv.levelId, null);
      }
    }
    // istilah yang dideklarasikan eksplisit
    for (const k of lv.newTerms ?? []) record(k, s, lv.levelId, null);

    // soal
    for (const q of lv.questions ?? []) {
      const seen = new Set();
      for (const txt of collectText([q.prompt, q.options, q.explanation])) {
        for (const k of findTerms(txt)) seen.add(k);
      }
      for (const k of q.terms ?? []) seen.add(k);
      for (const k of seen) record(k, s, lv.levelId, q.id);
    }
  }
}

if (!files.length) {
  const data = await readFile('src/data.js', 'utf8');
  for (const t of terms) {
    const count = data.split(t.kanji).length - 1;
    if (count) {
      const stat = stats.get(t.slug);
      stat.occurrences = count;
      stat.sections.add(t.sections?.[0] ?? 1);
      stat.levels.push({section:t.sections?.[0] ?? 1,level:1});
    }
  }
}

const enriched = terms.map((t) => {
  const s = stats.get(t.slug);
  return {
    ...t,
    occurrences: s.occurrences,
    sections: [...s.sections].sort((a, b) => a - b),
    levels: s.levels.sort((a, b) => a.section - b.section || a.level - b.level),
    questionIds: [...s.questionIds].sort(),
  };
});

await writeFile(
  OUT,
  JSON.stringify({ version: doc.version, builtAt: new Date().toISOString(), terms: enriched }, null, 1),
  'utf8'
);

const top = [...enriched].sort((a, b) => b.occurrences - a.occurrences).slice(0, 10);
const orphan = enriched.filter((t) => t.occurrences === 0);

console.log(`\n=== Indeks glossary ===`);
console.log(`Istilah   : ${enriched.length}`);
console.log(`Terpakai  : ${enriched.length - orphan.length}`);
console.log(`Belum muncul di konten: ${orphan.length}`);
console.log(`\nTop 10 tersering:`);
top.forEach((t, i) =>
  console.log(`  ${String(i + 1).padStart(2)}. ${t.kanji.padEnd(12)} ${String(t.occurrences).padStart(3)}x  ${t.id.short}`)
);
if (orphan.length) {
  console.log(`\nBelum muncul di konten manapun (kandidat dihapus atau kontennya yang kurang):`);
  orphan.slice(0, 20).forEach((t) => console.log(`  - ${t.kanji} (${t.slug})`));
  if (orphan.length > 20) console.log(`  … dan ${orphan.length - 20} lagi`);
}
console.log(`\nDitulis ke ${OUT}\n`);
