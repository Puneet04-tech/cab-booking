// Delete the test review so user can submit a real one
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function deleteTestReview() {
  const client = await pool.connect();
  try {
    console.log('Deleting test review...\n');
    
    const result = await client.query(`DELETE FROM reviews WHERE id = 1 RETURNING *`);
    
    if (result.rows.length > 0) {
      console.log('✅ Deleted test review:');
      console.log(`  ID: ${result.rows[0].id}`);
      console.log(`  Rating: ${result.rows[0].rating}`);
      console.log(`  Comment: ${result.rows[0].comment}`);
    } else {
      console.log('No test review found to delete');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteTestReview();
