import { neon } from '@neondatabase/serverless';
export function db(){
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
}
// Schema is managed via scripts/001_init.sql applied directly to Neon.
// No runtime ensureSchema() — serverless functions must not DDL on every request.
