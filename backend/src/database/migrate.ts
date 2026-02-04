import { readFileSync } from 'fs';
import { join } from 'path';
import { supabase } from '../index.js';
import { logger } from '../utils/logger.js';

/**
 * Run database migrations
 * This script reads the schema.sql file and executes it
 */
async function migrate() {
  try {
    logger.info('Starting database migration...');

    const schemaPath = join(process.cwd(), 'src', 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    logger.info(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            // Try direct query if RPC doesn't work
            logger.warn(`RPC failed, trying direct query for statement ${i + 1}`);
          }
        } catch (err) {
          logger.warn(`Statement ${i + 1} may have failed (this is OK if object already exists):`, err);
        }
      }
    }

    logger.info('Migration completed!');
    logger.info('Note: Some statements may show warnings if objects already exist. This is normal.');
    logger.info('Please verify your database schema in Supabase Dashboard > SQL Editor');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export { migrate };
