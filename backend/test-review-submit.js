// Test review submission manually
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testReviewSubmit() {
  const client = await pool.connect();
  try {
    console.log('Testing review submission...\n');
    
    // Get a completed ride with driver
    const rideResult = await client.query(`
      SELECT r.id, r.driver_id, r.rider_id, r.status,
             d.user_id AS driver_user_id,
             u_rider.clerk_id AS rider_clerk_id,
             u_rider.first_name || ' ' || u_rider.last_name AS rider_name,
             u_driver.first_name || ' ' || u_driver.last_name AS driver_name
      FROM rides r 
      JOIN users u_rider ON u_rider.id = r.rider_id 
      JOIN drivers d ON d.id = r.driver_id
      JOIN users u_driver ON u_driver.id = d.user_id
      WHERE r.status = 'completed'
      ORDER BY r.completed_at DESC
      LIMIT 1
    `);
    
    if (rideResult.rows.length === 0) {
      console.log('❌ No completed rides found!');
      return;
    }
    
    const ride = rideResult.rows[0];
    console.log('Found completed ride:');
    console.log(`  Ride ID: ${ride.id}`);
    console.log(`  Rider: ${ride.rider_name} (Clerk: ${ride.rider_clerk_id})`);
    console.log(`  Driver: ${ride.driver_name} (User ID: ${ride.driver_user_id})`);
    console.log(`  Status: ${ride.status}\n`);
    
    // Check if review already exists
    const existingReview = await client.query(
      `SELECT * FROM reviews WHERE ride_id = $1`,
      [ride.id]
    );
    
    if (existingReview.rows.length > 0) {
      console.log('✓ Review already exists for this ride:');
      console.log(`  Rating: ${existingReview.rows[0].rating}`);
      console.log(`  Comment: ${existingReview.rows[0].comment || 'None'}`);
      return;
    }
    
    console.log('No review exists yet. Creating test review...\n');
    
    // Insert a test review
    await client.query(
      `INSERT INTO reviews(ride_id, reviewer_id, reviewee_id, rating, comment)
       VALUES($1, $2, $3, $4, $5)`,
      [ride.id, ride.rider_id, ride.driver_user_id, 5, 'Great driver! Test review']
    );
    
    console.log('✅ Review inserted successfully!\n');
    
    // Verify insertion
    const verifyResult = await client.query(
      `SELECT rv.*, u.first_name || ' ' || u.last_name AS reviewer_name
       FROM reviews rv
       JOIN users u ON u.id = rv.reviewer_id
       WHERE rv.ride_id = $1`,
      [ride.id]
    );
    
    console.log('Verification:');
    console.log(`  Review ID: ${verifyResult.rows[0].id}`);
    console.log(`  Rating: ${verifyResult.rows[0].rating}`);
    console.log(`  Comment: ${verifyResult.rows[0].comment}`);
    console.log(`  Reviewer: ${verifyResult.rows[0].reviewer_name}`);
    console.log(`  Reviewee ID: ${verifyResult.rows[0].reviewee_id}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testReviewSubmit();
