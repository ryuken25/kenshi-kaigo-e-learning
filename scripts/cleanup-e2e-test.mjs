import { scriptDb } from '../api/_db.mjs';
const sql = scriptDb();
const email = 'e2e-smoke-test@kaigokitty.internal';
const del1 = await sql`DELETE FROM app_users WHERE email = ${email} RETURNING id`;
console.log('Deleted test user(s):', JSON.stringify(del1));
const del2 = await sql`DELETE FROM magic_tokens WHERE email = ${email} RETURNING id`;
console.log('Deleted test magic_tokens:', JSON.stringify(del2));
const remaining = await sql`SELECT count(*)::int AS c FROM app_users`;
console.log('Remaining app_users:', JSON.stringify(remaining));

// postgres.js menahan socket tetap hidup; tanpa end() skrip ini menggantung.
await sql.end();
