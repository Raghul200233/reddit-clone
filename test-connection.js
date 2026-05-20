const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.rhfxeodbsfkvqwutjcet:LUDys6EdvfulK7DD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
});

async function test() {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as db');
    console.log('✅ Connected successfully!');
    console.log('📅 Server time:', result.rows[0].time);
    console.log('🗄️ Database:', result.rows[0].db);
    
    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables in database:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
  process.exit();
}

test();