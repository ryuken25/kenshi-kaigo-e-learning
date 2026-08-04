import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }
const sql = neon(url);

const tables = ['app_users', 'magic_tokens', 'app_sessions', 'level_progress'];
const out = {};
for (const t of tables) {
  try {
    const rows = await sql.query(`SELECT * FROM ${t}`);
    out[t] = rows;
    console.log(`${t}: ${rows.length} rows`);
  } catch (e) {
    out[t] = { error: String(e.message || e) };
    console.log(`${t}: ERROR ${e.message}`);
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
console.log('Backup written to', process.argv[2]);
