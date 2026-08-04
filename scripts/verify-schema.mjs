import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const tables = ['app_users','app_sessions','magic_tokens','level_progress','daily_activity','question_attempts','level_attempts','progress_merges'];
for (const t of tables) {
  const cols = await sql.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [t]);
  console.log(`\n${t} (${cols.length} cols):`);
  for (const c of cols) console.log(`  ${c.column_name}: ${c.data_type}`);
}
const constraints = await sql.query(`SELECT conname, conrelid::regclass AS table FROM pg_constraint WHERE conrelid::regclass::text IN ('level_progress','app_users') ORDER BY table`);
console.log('\nConstraints:', JSON.stringify(constraints, null, 2));
