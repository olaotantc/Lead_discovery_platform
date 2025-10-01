import { Client } from 'pg';

async function createDatabase() {
  // Connect to default 'postgres' database first
  const client = new Client({
    user: 'olaotantowry-coker',
    host: 'localhost',
    database: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Postgres');

    // Check if database exists
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'signalrunner_dev'"
    );

    if (checkDb.rowCount && checkDb.rowCount > 0) {
      console.log('✅ Database signalrunner_dev already exists');
    } else {
      console.log('🔄 Creating database signalrunner_dev...');
      await client.query('CREATE DATABASE signalrunner_dev');
      console.log('✅ Database created successfully');
    }
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to Postgres. Is it running?');
    } else if (err.code === '28P01') {
      console.error('❌ Password authentication failed');
      console.error('   Try updating pg_hba.conf to use "trust" authentication');
    } else {
      console.error('❌ Error:', err.message);
    }
    throw err;
  } finally {
    await client.end();
  }
}

createDatabase();
