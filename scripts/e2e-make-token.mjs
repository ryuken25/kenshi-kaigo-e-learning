import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
const sql = neon(url);
const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');

const email = process.argv[2] || 'e2e-smoke-test@kaigokitty.internal';
const raw = crypto.randomBytes(32).toString('base64url');

await sql`INSERT INTO magic_tokens(email, token_hash, expires_at) VALUES(${email}, ${hash(raw)}, now() + interval '20 minutes')`;
console.log(raw);
