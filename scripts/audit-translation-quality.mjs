#!/usr/bin/env node
// audit-translation-quality.mjs — dari pack v7 (docs/v7/44-TRANSLATION-QUALITY.md),
// diadaptasi untuk repo ini.
//
// audit-content-coverage.mjs cuma mengecek `id` TIDAK KOSONG. Itu tidak cukup:
// terjemahan template lolos pemeriksaan itu karena isinya memang ada — cuma bukan
// terjemahan. Contoh nyata dari production sebelum integrasi v7:
//   ja: "事例の読み方は、介護福祉士国家試験で重要な学習テーマです…"   (3 paragraf)
//   id: "事例の読み方 adalah materi penting. Hubungkan teori dengan…"    (1 kalimat cetakan)
//
// ADAPTASI untuk repo ini: konten level bukan JSON di src/content/sections/ — semuanya
// GENERATED di src/data.js saat import. Maka sumber utama audit adalah hasil import
// sections[].levels[].materi + objective. Folder JSON tetap dipindai kalau suatu hari
// ada konten statis baru di sana.
//
// Yang DIAUDIT penuh (6 pemeriksaan): kartu materi (body/heading/points), objective,
// dan teks opsi soal ujian akhir.
// Yang DIKECUALIKAN dari deteksi template (bukan dari pemeriksaan lain): field soal
// yang memang templated-by-design — explanationId/explanationJa & choiceIds soal level,
// explanation & opsi soal ujian (12 template × 60-an pemakaian; keputusan struktur ada
// di docs/v7/45-FINAL-TEST-STRUCTURE.md). prompt.id ujian menyisipkan nama mapel kanji
// dengan sengaja (prompt bilingual) → dilaporkan sebagai angka peringatan, bukan error.
//
//   node scripts/audit-translation-quality.mjs
//   node scripts/audit-translation-quality.mjs --strict   → exit 1 kalau ada error

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const STRICT = process.argv.includes('--strict');
const DIRS = ['src/content/sections', 'src/content/final'];

const RUBY_RE = /([一-鿿々〆ヶ]+)\[([ぁ-ゟァ-ーー]+)\]/g;
const CJK_RE  = /[぀-ヿ一-鿿]/g;

// Ambang. Diturunkan dari perbandingan: terjemahan Indonesia yang benar
// biasanya 1,5–3× jumlah karakter sumber Jepangnya, karena Jepang jauh lebih padat.
const MIN_RATIO       = 0.9;   // di bawah ini hampir pasti dipotong / template
const SUSPECT_RATIO   = 1.2;   // di bawah ini patut dicurigai
const MAX_CJK_IN_ID   = 4;     // "martabat (尊厳)" wajar; judul Jepang utuh tidak
const TEMPLATE_REPEAT = 3;     // skeleton sama muncul ≥3× = kalimat cetakan

// Frasa cetakan yang sudah teridentifikasi. Tambahkan kalau ketemu pola baru.
const FILLER_PHRASES = [
  'adalah materi penting',
  'adalah tema belajar penting',
  'hubungkan teori dengan',
  'materi ini penting untuk',
  'pelajari materi ini',
  'terjemahan belum tersedia',
  'lorem ipsum',
  'tbd', 'todo', 'coming soon', 'segera hadir',
];

const findings = [];
const skeletons = new Map();   // skeleton -> [where]
let checked = 0;
let examPromptCjk = 0;         // prompt.id ujian dengan nama mapel kanji (by design)

const stripRuby = (s) => String(s ?? '').replace(RUBY_RE, '$1');

/** Buang bagian yang berubah-ubah, sisakan kerangka kalimatnya. */
function skeletonize(id) {
  return String(id ?? '')
    .toLowerCase()
    .replace(CJK_RE, '')          // judul Jepang yang diselipkan
    .replace(/\d+/g, '')
    .replace(/[^\p{L}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function paragraphs(s) {
  return String(s ?? '').split(/\n{2,}/).filter((p) => p.trim()).length || 1;
}

function checkField(field, where, { skeleton = true } = {}) {
  if (!field || typeof field !== 'object') return;
  const rawJa = typeof field.ja === 'string' ? field.ja : '';
  const id = typeof field.id === 'string' ? field.id.trim() : '';
  if (!rawJa || !id) return;                 // ditangani audit cakupan

  const ja = stripRuby(rawJa).trim();
  if (ja.length < 12) return;                // terlalu pendek untuk dinilai

  checked += 1;
  const add = (kind, msg, sev = 'error') => findings.push({ where, kind, msg, sev });

  // 1. Jepang bocor ke mode ID
  const cjk = (id.match(CJK_RE) ?? []).length;
  if (cjk > MAX_CJK_IN_ID) {
    add('japanese_in_id', `${cjk} karakter Jepang di teks Indonesia — mode ID menampilkan kanji`);
  }

  // 2. Rasio panjang
  const ratio = id.length / ja.length;
  if (ratio < MIN_RATIO) {
    add('too_short', `panjang ${id.length} vs sumber ${ja.length} (rasio ${ratio.toFixed(2)}, wajar ≥${SUSPECT_RATIO})`);
  } else if (ratio < SUSPECT_RATIO) {
    add('suspect_short', `rasio ${ratio.toFixed(2)} — mungkin ada bagian yang tidak diterjemahkan`, 'warn');
  }

  // 3. Jumlah paragraf tidak cocok
  const pJa = paragraphs(rawJa), pId = paragraphs(id);
  if (pId < pJa) {
    add('paragraph_loss', `sumber ${pJa} paragraf, terjemahan ${pId} — ada paragraf yang hilang`);
  }

  // 4. Frasa cetakan
  const low = id.toLowerCase();
  for (const f of FILLER_PHRASES) {
    if (low.includes(f)) { add('filler_phrase', `mengandung frasa cetakan: "${f}"`); break; }
  }

  // 4b. Kalimat hilang (pack v8 doc 51): hitung kalimat sumber vs terjemahan.
  // Satu kalimat Jepang boleh jadi dua kalimat Indonesia (wajar), tapi tidak boleh nol.
  const sJa = (ja.match(/[。！？]/g) ?? []).length;
  const sId = (id.match(/[.!?](?=\s|$)/g) ?? []).length;
  if (sJa > 0 && sId === 0) {
    add('sentence_loss', `sumber ${sJa} kalimat, terjemahan nol kalimat`);
  } else if (sJa > sId && sJa - sId >= 2) {
    add('sentence_loss', `sumber ${sJa} kalimat → terjemahan ${sId} — ada kalimat yang hilang`);
  }

  // 5. Kumpulkan skeleton untuk deteksi template
  if (skeleton) {
    const sk = skeletonize(id);
    if (sk.length > 20) {
      if (!skeletons.has(sk)) skeletons.set(sk, []);
      skeletons.get(sk).push(where);
    }
  }
}

const BILINGUAL = (n) =>
  typeof n.ja === 'string' ||
  (typeof n.id === 'string' && (/\s/.test(n.id) || n.id.length > 24));

function walk(node, path) {
  if (node == null || typeof node !== 'object') return;
  if (!Array.isArray(node) && BILINGUAL(node)) { checkField(node, path); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`)); return; }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('_')) continue;
    walk(v, path ? `${path}.${k}` : k);
  }
}

// ---- Sumber 1: JSON statis (kalau ada) ----
for (const dir of DIRS) {
  if (!existsSync(dir)) continue;
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.json')).sort()) {
    const data = JSON.parse(await readFile(join(dir, f), 'utf8'));
    walk(data, f.replace('.json', ''));
  }
}

// ---- Sumber 2: pohon generated dari src/data.js ----
const { sections } = await import('../src/data.js');
const titleIds = new Set();
for (const s of sections) {
  for (const l of s.levels) {
    // C2 pack v7: judul level dulunya `Belajar 事例の読み方` — kanji bocor ke mode ID.
    // Sekarang titleId harus 100% Indonesia.
    const cjk = (String(l.titleId).match(CJK_RE) ?? []).length;
    if (cjk > 0) {
      findings.push({ where: `s${s.id}.level${l.id}.titleId`, kind: 'japanese_in_id', sev: 'error', msg: `${cjk} karakter Jepang di titleId: "${l.titleId}"` });
    }
    titleIds.add(l.titleId);
    // objective = pasangan ja/id datar di level
    checkField({ ja: l.objective, id: l.objectiveId }, `s${s.id}.level${l.id}.objective`);
    for (const c of l.materi) walk(c, `s${s.id}.level${l.id}.${c.type}`);
  }
}
if (titleIds.size !== sections.reduce((n, s) => n + s.levels.length, 0)) {
  findings.push({ where: 'titleId', kind: 'template', sev: 'error', msg: `titleId tidak unik: ${titleIds.size} unik dari ${sections.reduce((n, s) => n + s.levels.length, 0)} level — ada judul yang dipakai ulang` });
}

// ---- Sumber 3: ujian akhir (src/content/final/index.js) ----
// Opsi diperiksa penuh kecuali skeleton (60 teks opsi dipakai ±62× oleh 12 template —
// templated-by-design, sama seperti soal level). Explanation hanya id → cek CJK + filler.
const { default: finalData } = await import('../src/content/final/index.js');
for (const [year, exam] of Object.entries(finalData)) {
  for (const q of exam.questions) {
    const pCjk = (stripRuby(q.prompt.id).match(CJK_RE) ?? []).length;
    if (pCjk > MAX_CJK_IN_ID) examPromptCjk += 1;
    for (const o of q.options) checkField(o.text, `${year}.q${q.no}.opt${o.key}`, { skeleton: false });
    const exId = typeof q.explanation?.id === 'string' ? q.explanation.id.trim() : '';
    if (exId) {
      checked += 1;
      const where = `${year}.q${q.no}.explanation`;
      const cjk = (exId.match(CJK_RE) ?? []).length;
      if (cjk > MAX_CJK_IN_ID) {
        findings.push({ where, kind: 'japanese_in_id', sev: 'error', msg: `${cjk} karakter Jepang di penjelasan Indonesia` });
      }
      const low = exId.toLowerCase();
      for (const f of FILLER_PHRASES) {
        if (low.includes(f)) { findings.push({ where, kind: 'filler_phrase', sev: 'error', msg: `mengandung frasa cetakan: "${f}"` }); break; }
      }
    }
  }
}

// 6. Template: skeleton yang sama dipakai berkali-kali
const templates = [...skeletons.entries()].filter(([, w]) => w.length >= TEMPLATE_REPEAT);
for (const [sk, where] of templates) {
  findings.push({
    where: `${where.length} kartu`,
    kind: 'template',
    sev: 'error',
    msg: `kalimat cetakan dipakai ${where.length}×: "${sk.slice(0, 70)}…"`,
    sample: where.slice(0, 3),
  });
}

// ---------- laporan ----------
const errors = findings.filter((f) => f.sev === 'error');
const warns  = findings.filter((f) => f.sev === 'warn');
const byKind = findings.reduce((m, f) => (m[f.kind] = (m[f.kind] ?? 0) + 1, m), {});

console.log('\n=== MUTU TERJEMAHAN ===\n');
console.log('field diperiksa          :', checked);
console.log('titleId unik             :', `${titleIds.size}/${sections.reduce((n, s) => n + s.levels.length, 0)}`);
console.log('prompt ujian ber-kanji   :', `${examPromptCjk} (by design — nama mapel di prompt bilingual)`);
console.log('error                    :', errors.length);
console.log('peringatan               :', warns.length);
console.log('per jenis                :', byKind);

if (templates.length) {
  console.log(`\n⚠️  ${templates.length} pola kalimat cetakan terdeteksi.`);
  console.log('    Ini yang paling penting: terjemahan template lolos audit cakupan');
  console.log('    karena field-nya terisi, padahal isinya bukan terjemahan.');
}

if (findings.length) {
  // Error dicetak SEMUA (ini yang menentukan gate), peringatan dibatasi 10.
  if (errors.length) {
    console.log('\n--- ERROR ---');
    for (const f of errors) {
      console.log(`  ✗ ${f.kind.padEnd(16)} ${f.where}`);
      console.log(`      ${f.msg}`);
      if (f.sample) console.log(`      contoh: ${f.sample.join(', ')}`);
    }
  }
  if (warns.length) {
    console.log('\n--- PERINGATAN (10 pertama) ---');
    for (const f of warns.slice(0, 10)) {
      console.log(`  ! ${f.kind.padEnd(16)} ${f.where}`);
      console.log(`      ${f.msg}`);
    }
    if (warns.length > 10) console.log(`  … dan ${warns.length - 10} peringatan lagi`);
  }
}

console.log(errors.length === 0 ? '\n✅ Tidak ada masalah mutu\n' : `\n❌ ${errors.length} error\n`);
if (STRICT && errors.length) process.exit(1);
