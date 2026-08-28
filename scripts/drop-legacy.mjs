import { scriptDb } from '../api/_db.mjs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }
const sql = scriptDb(url);

console.log('Dropping legacy tables (confirmed empty via backup)...');
await sql.query('DROP TABLE IF EXISTS level_progress, app_sessions, magic_tokens, app_users CASCADE;');
console.log('DROPPED OK');

const rows = await sql.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
console.log('Remaining tables:', JSON.stringify(rows));

// postgres.js menahan socket tetap hidup; tanpa end() skrip ini menggantung.
await sql.end();
