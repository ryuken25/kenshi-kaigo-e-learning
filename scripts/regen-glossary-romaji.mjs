#!/usr/bin/env node
/* regen-glossary-romaji.mjs — hasilkan ulang seluruh field `romaji` di glossary
   dari field `reading` via kanaToRomaji (Hepburn). Pack v8 menemukan romaji
   ketikan tangan yang salah (統合失調症: "shicchoushou" seharusnya "shitchoushou").
   Aturan baru: romaji tidak boleh diketik tangan, selalu diturunkan dari kana.

   Mode default: kering (cuma laporkan beda). --write: tulis ulang kedua file
   (glossary.json sumbernya, glossary.index.json hasil build — keduanya committed).
   Keluar 1 kalau ada beda (dalam mode kering) supaya bisa jadi gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kanaToRomaji } from '../src/lib/kana.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');
const targets = [path.join(root, 'src/content/glossary.json'), path.join(root, 'src/content/glossary.index.json')];

let diffs = 0, checked = 0, written = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) { console.error(`file tidak ada: ${file}`); process.exit(1); }
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  const terms = data.terms ?? data;
  const changed = [];
  for (const t of terms) {
    if (!t || !t.reading) continue;
    checked++;
    const derived = kanaToRomaji(t.reading);
    if ((t.romaji ?? '') !== derived) {
      diffs++;
      changed.push({ slug: t.slug ?? t.kanji, from: t.romaji ?? '(kosong)', to: derived });
      if (WRITE) t.romaji = derived;
    }
  }
  if (WRITE) {
    // Pertahankan indent 2 — glossary.json adalah konten curated, diffability penting.
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    written++;
    console.log(`${path.basename(file)}: ${changed.length} romaji diperbarui dari ${checked} term`);
  } else {
    console.log(`${path.basename(file)}: ${changed.length} beda dari ${checked} term`);
  }
  for (const c of changed.slice(0, 25)) console.log(`  ${c.slug}: "${c.from}" → "${c.to}"`);
  if (changed.length > 25) console.log(`  … dan ${changed.length - 25} lagi`);
}
console.log(WRITE ? `Selesai: ${written} file ditulis, ${diffs} field diperbaiki.` : `Total: ${diffs} field beda (dari ${checked} term per file). Jalankan dengan --write untuk memperbaiki.`);
process.exit(WRITE || diffs === 0 ? 0 : 1);
