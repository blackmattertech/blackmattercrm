/**
 * Optional seed script. No demo data is inserted by default.
 *
 * To create an admin user:
 * 1. Create a user via Supabase Dashboard (Authentication > Users) or app signup.
 * 2. Run fix_admin_user.sql or create_admin_from_scratch.sql in Supabase SQL Editor
 *    to set role to 'admin' and approval_status to 'approved'.
 *
 * Run: npx tsx src/database/seed.ts (or npm run seed from backend directory)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, '..', '..', '..', '.env');
dotenv.config({ path: rootEnv });

console.log('Seed script (optional). No data inserted.');
console.log('To create an admin: run fix_admin_user.sql or create_admin_from_scratch.sql in Supabase SQL Editor after creating a user in the Dashboard.');
process.exit(0);
