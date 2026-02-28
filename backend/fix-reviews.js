// Fix existing reviews - update reviewee_id from driver_id to user_id
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixReviews() {
  const client = await pool.connect();
  try {
    console.log('Checking existing reviews...');
    
    // Get all reviews with their ride info
    const reviewsResult = await client.query(`
      SELECT rv.id, rv.reviewee_id, r.driver_id, d.user_id 
      FROM reviews rv
      JOIN rides r ON r.id = rv.ride_id
      JOIN drivers d ON d.id = r.driver_id
      WHERE rv.reviewee_id = r.driver_id
    `);
    
    console.log(`Found ${reviewsResult.rows.length} reviews to fix`);
    
    if (reviewsResult.rows.length === 0) {
      console.log('No reviews need fixing!');
      return;
    }
    
    // Update each review's reviewee_id to user_id
    for (const review of reviewsResult.rows) {
      await client.query(
        'UPDATE reviews SET reviewee_id = $1 WHERE id = $2',
        [review.user_id, review.id]
      );
      console.log(`Fixed review ${review.id}: ${review.reviewee_id} -> ${review.user_id}`);
    }
    
    console.log('All reviews fixed successfully!');
  } catch (error) {
    console.error('Error fixing reviews:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixReviews();
