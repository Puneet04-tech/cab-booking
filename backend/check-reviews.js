// Check what reviews exist in the database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkReviews() {
  const client = await pool.connect();
  try {
    console.log('Checking all reviews in database...\n');
    
    const result = await client.query(`
      SELECT rv.id, rv.rating, rv.comment, rv.reviewer_id, rv.reviewee_id, rv.ride_id,
             r.driver_id, d.user_id as driver_user_id,
             u_reviewer.first_name || ' ' || u_reviewer.last_name as reviewer_name,
             u_reviewee.first_name || ' ' || u_reviewee.last_name as reviewee_name
      FROM reviews rv
      LEFT JOIN rides r ON r.id = rv.ride_id
      LEFT JOIN drivers d ON d.id = r.driver_id
      LEFT JOIN users u_reviewer ON u_reviewer.id = rv.reviewer_id
      LEFT JOIN users u_reviewee ON u_reviewee.id = rv.reviewee_id
      ORDER BY rv.created_at DESC
    `);
    
    console.log(`Total reviews found: ${result.rows.length}\n`);
    
    if (result.rows.length === 0) {
      console.log('No reviews in database yet!');
    } else {
      result.rows.forEach((r, i) => {
        console.log(`Review ${i + 1}:`);
        console.log(`  ID: ${r.id}`);
        console.log(`  Rating: ${r.rating}`);
        console.log(`  Comment: ${r.comment || 'None'}`);
        console.log(`  Reviewer: ${r.reviewer_name} (ID: ${r.reviewer_id})`);
        console.log(`  Reviewee: ${r.reviewee_name} (ID: ${r.reviewee_id})`);
        console.log(`  Ride Driver ID: ${r.driver_id}`);
        console.log(`  Driver User ID: ${r.driver_user_id}`);
        console.log(`  Match: ${r.reviewee_id === r.driver_user_id ? '✓ Correct' : '✗ Wrong'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error checking reviews:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkReviews();
