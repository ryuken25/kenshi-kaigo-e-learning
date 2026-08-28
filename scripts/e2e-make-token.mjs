import crypto from 'node:crypto';
import { scriptDb } from '../api/_db.mjs';

const url = process.env.DATABASE_URL;
const sql = scriptDb(url);
const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');

const email = process.argv[2] || 'e2e-smoke-test@kaigokitty.internal';
const raw = crypto.randomBytes(32).toString('base64url');

await sql`INSERT INTO magic_tokens(email, token_hash, expires_at) VALUES(${email}, ${hash(raw)}, now() + interval '20 minutes')`;
console.log(raw);

// postgres.js menahan socket tetap hidup; tanpa end() skrip ini menggantung.
await sql.end();
