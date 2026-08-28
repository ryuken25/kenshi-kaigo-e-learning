import { scriptDb, isNeonUrl } from '../api/_db.mjs';
import fs from 'node:fs';

// Migrasi harus lewat koneksi LANGSUNG, bukan pooler: Supavisor transaction mode
// (port 6543) tidak cocok untuk DDL panjang/advisory lock, dan README memang
// menyuruh pakai DATABASE_URL_UNPOOLED. Jadi UNPOOLED didahulukan kalau ada;
// kalau tidak, jatuh ke DATABASE_URL seperti perilaku lama.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }
console.log(`Koneksi: ${process.env.DATABASE_URL_UNPOOLED ? 'DATABASE_URL_UNPOOLED' : 'DATABASE_URL'} (driver: ${isNeonUrl(url) ? 'neon-http' : 'postgres.js'})`);
const sql = scriptDb(url);

const file = process.argv[2];
if (!file) { console.error('usage: node run-migration.mjs <sqlfile>'); process.exit(1); }
let text = fs.readFileSync(file, 'utf8');

// Strip BEGIN/COMMIT — driver neon http auto-commit per statement; jalur postgres.js
// juga dijalankan per-statement lewat .query(), jadi berkas ini TIDAK atomik di keduanya.
text = text.replace(/^\s*BEGIN;\s*$/gm, '').replace(/^\s*COMMIT;\s*$/gm, '');

// Strip komentar `--` SEBELUM split: titik koma di dalam komentar pernah
// memotong statement di tengah jalan (008_characters.sql, 2026-08-11) dan
// paruh statement-nya lolos sebagai "OK" karena isinya cuma komentar.
text = text.replace(/--.*$/gm, '');

// Split into statements, respecting $$ ... $$ dollar-quoted blocks.
function splitStatements(sqlText) {
  const stmts = [];
  let cur = '';
  let inDollar = false;
  let i = 0;
  while (i < sqlText.length) {
    if (sqlText.slice(i, i + 2) === '$$') {
      inDollar = !inDollar;
      cur += '$$';
      i += 2;
      continue;
    }
    const ch = sqlText[i];
    if (ch === ';' && !inDollar) {
      cur += ch;
      const trimmed = cur.trim();
      if (trimmed.length > 0) stmts.push(trimmed);
      cur = '';
    } else {
      cur += ch;
    }
    i++;
  }
  const rest = cur.trim();
  if (rest.length > 0) stmts.push(rest);
  return stmts;
}

const statements = splitStatements(text).filter(s => {
  const t = s.replace(/--.*$/gm, '').trim();
  return t.length > 0;
});

console.log(`Found ${statements.length} statements.`);
let ok = 0, failed = 0;
for (const [idx, stmt] of statements.entries()) {
  const preview = stmt.slice(0, 80).replace(/\n/g, ' ');
  try {
    await sql.query(stmt);
    ok++;
    console.log(`[${idx + 1}/${statements.length}] OK: ${preview}`);
  } catch (e) {
    failed++;
    console.log(`[${idx + 1}/${statements.length}] FAIL: ${preview}`);
    console.log(`   -> ${e.message}`);
  }
}
console.log(`\nDone. OK=${ok} FAILED=${failed}`);
await sql.end(); // postgres.js: tanpa ini proses menggantung (neon: no-op)
if (failed > 0) process.exit(1);
