// annotate-final-data.mjs — pasang furigana bracket notation INLINE ke file data
// soal asli ujian akhir (src/content/final/data/{year}.json).
//
//   node scripts/annotate-final-data.mjs <input.json> [<input2.json> ...]
//
// Input = JSON hasil pipeline terjemahan: {year, kai, examDate, questions:[
//   {no, subject, prompt:{ja,id}, options:[{key,text:{ja,id}}], answer, ...}]}.
// Field ja di prompt & opsi dianotasi kuroshiro + kamus koreksi istilah kaigo
// (scripts/lib-furigana.mjs — sumber logika yang sama dengan gen-furigana.mjs).
//
// KENAPA INLINE, BUKAN lewat kamus furigana.generated.js: kamus itu ikut bundle
// UTAMA (Furigana.jsx mengimpornya), sedangkan 750 soal asli hanya hidup di chunk
// lazy /final — menaruh anotasinya inline menjaga bundle utama tetap kecil, dan
// annotate() di Furigana.jsx memang short-circuit string yang sudah ber-bracket.
// gen-furigana.mjs pun otomatis MELEWATI string yang sudah beranotasi (BRACKETED),
// jadi kamus tidak membengkak oleh soal ujian.
//
// subject SENGAJA tidak dianotasi: tidak pernah dirender lewat Furigana.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import KuroshiroImport from 'kuroshiro';
import KuromojiAnalyzerImport from 'kuroshiro-analyzer-kuromoji';
import { annotateString } from './lib-furigana.mjs';

const inputs = process.argv.slice(2);
if (!inputs.length) { console.error('usage: node scripts/annotate-final-data.mjs <input.json> ...'); process.exit(1); }

const Kuroshiro = KuroshiroImport.default || KuroshiroImport;
const KuromojiAnalyzer = KuromojiAnalyzerImport.default || KuromojiAnalyzerImport;
const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer());

mkdirSync(new URL('../src/content/final/data/', import.meta.url), { recursive: true });

let exitCode = 0;
for (const input of inputs) {
  const d = JSON.parse(readFileSync(input, 'utf8'));
  if (!Number.isInteger(d.year) || !Array.isArray(d.questions)) { console.error(`${basename(input)}: bukan file data final (year/questions hilang)`); exitCode = 1; continue; }
  let annotated = 0, dropped = 0, corrected = 0, sanitized = 0;
  const doField = async (t) => {
    const r = await annotateString(kuroshiro, t);
    if (r.status === 'annotated') annotated++;
    if (r.sanitized) { sanitized++; console.warn(`  [${d.year}] bracket non-kana dicopot sebagian: ${String(t).slice(0, 40).replace(/\n/g, ' ')}`); }
    if (r.status === 'leftover' || r.status === 'failed') { dropped++; console.warn(`  [${d.year}] anotasi dibuang (${r.status}): ${String(t).slice(0, 40).replace(/\n/g, ' ')}`); }
    if (r.corrected) corrected++;
    return r.status === 'annotated' ? r.text : t;
  };
  for (const q of d.questions) {
    q.prompt.ja = await doField(q.prompt.ja);
    for (const o of q.options) o.text.ja = await doField(o.text.ja);
  }
  const out = new URL(`../src/content/final/data/${d.year}.json`, import.meta.url);
  writeFileSync(out, JSON.stringify(d, null, 0) + '\n');
  console.log(`${d.year}: ${d.questions.length} soal → ${out.pathname.split('/').pop()} (${annotated} field beranotasi, ${corrected} koreksi istilah, ${sanitized} disanitasi sebagian, ${dropped} dibuang)`);
}
process.exit(exitCode);
