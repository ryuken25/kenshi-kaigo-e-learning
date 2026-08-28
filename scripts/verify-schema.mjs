import { scriptDb } from '../api/_db.mjs';
const sql = scriptDb();
const tables = ['app_users','app_sessions','magic_tokens','level_progress','daily_activity','question_attempts','level_attempts','progress_merges'];
for (const t of tables) {
  const cols = await sql.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [t]);
  console.log(`\n${t} (${cols.length} cols):`);
  for (const c of cols) console.log(`  ${c.column_name}: ${c.data_type}`);
}
// `table` itu reserved word — `AS table` bikin syntax error 42601 (pernah kejadian, script ini
// dulu selalu mati di baris terakhir sesudah kolom-kolomnya sukses ke-dump). Pakai alias `tbl`.
// pg_get_constraintdef() ikut diambil karena tanpa definisi lengkapnya kita cuma tau NAMA
// constraint-nya ada, bukan isinya benar — dan itu yang perlu diverifikasi sesudah migrasi 005.
const constraints = await sql.query(`SELECT conname, conrelid::regclass::text AS tbl, contype, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid::regclass::text IN ('level_progress','app_users') ORDER BY tbl, conname`);
console.log(`\nConstraints (${constraints.length}):`);
for (const c of constraints) console.log(`  [${c.contype}] ${c.tbl}.${c.conname}\n      ${c.def}`);

// postgres.js menahan socket tetap hidup; tanpa end() skrip ini menggantung.
await sql.end();
