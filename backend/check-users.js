// Check user clerk IDs
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsers() {
  const client = await pool.connect();
  try {
    console.log('Checking all users and their clerk_ids...\n');
    
    const result = await client.query(`
      SELECT id, clerk_id, first_name, last_name, email, role
      FROM users
      ORDER BY id
    `);
    
    console.log(`Total users: ${result.rows.length}\n`);
    
    result.rows.forEach((u, i) => {
      console.log(`User ${i + 1}:`);
      console.log(`  ID: ${u.id}`);
      console.log(`  Name: ${u.first_name} ${u.last_name}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  Clerk ID: ${u.clerk_id || '❌ NULL'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers();
