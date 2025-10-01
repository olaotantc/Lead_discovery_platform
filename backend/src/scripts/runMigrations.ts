import { createPostgresPool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const pool = createPostgresPool();
  try {
    console.log('🔄 Running database migrations...');
    const migrationPath = path.join(__dirname, '../migrations/001_create_users_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pool.query(sql);
    console.log('✅ Migrations completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

runMigrations();

