import { query } from "../config/database";
import logger from "../utils/logger";

/**
 * Calculate carbon footprint for a ride
 * Average car emits ~0.2 kg CO2/km
 * Ride-sharing reduces emissions by ~65%
 */
export async function calculateAndSaveCarbonFootprint(
  userId: string,
  rideId: string,
  rideType: string,
  distanceKm: number
): Promise<void> {
  try {
    // Car emissions: avg 200g CO2/km
    const carEmissions = distanceKm * 0.2;
    
    // Ride-sharing factor based on vehicle type
    const sharingFactors: Record<string, number> = {
      economy: 0.70,  // 70% reduction (efficient + shared)
      premium: 0.55,  // 55% reduction (less efficient but single passenger)
      suv: 0.45,      // 45% reduction (least efficient)
      auto: 0.75      // 75% reduction (most efficient)
    };
    
    const reductionFactor = sharingFactors[rideType] || 0.65;
    const co2SavedKg = carEmissions * reductionFactor;
    
    // Trees: 1 tree absorbs ~21 kg CO2 per year
    const treesEquivalent = co2SavedKg / 21;
    
    await query(
      `INSERT INTO carbon_footprint 
       (user_id, ride_id, co2_saved_kg, trees_equivalent, ride_type, distance_km)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (ride_id) DO NOTHING`,
      [userId, rideId, co2SavedKg.toFixed(3), treesEquivalent.toFixed(2), rideType, distanceKm]
    );
    
    // Check for achievements
    await checkCarbonAchievements(userId);
  } catch (err) {
    logger.error("Error calculating carbon footprint:", err);
  }
}

export async function getUserCarbonStats(userId: string) {
  const result = await query<{
    total_eco_rides: string;
    total_co2_saved_kg: string;
    total_trees_equivalent: string;
    avg_co2_per_ride: string;
  }>(
    `SELECT * FROM user_carbon_stats WHERE user_id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    return {
      totalEcoRides: 0,
      totalCO2SavedKg: 0,
      totalTreesEquivalent: 0,
      avgCO2PerRide: 0
    };
  }
  
  const stats = result.rows[0];
  return {
    totalEcoRides: parseInt(stats.total_eco_rides || '0'),
    totalCO2SavedKg: parseFloat(stats.total_co2_saved_kg || '0'),
    totalTreesEquivalent: parseFloat(stats.total_trees_equivalent || '0'),
    avgCO2PerRide: parseFloat(stats.avg_co2_per_ride || '0')
  };
}

async function checkCarbonAchievements(userId: string): Promise<void> {
  const stats = await getUserCarbonStats(userId);
  
  // Eco Warrior: 50kg CO2 saved
  if (stats.totalCO2SavedKg >= 50) {
    await awardAchievement(userId, 'eco_warrior');
  }
  
  // Tree Hugger: 100kg CO2 saved
  if (stats.totalCO2SavedKg >= 100) {
    await awardAchievement(userId, 'tree_hugger');
  }
}

async function awardAchievement(userId: string, achievementCode: string): Promise<void> {
  try {
    const achievement = await query<{ id: string }>(
      `SELECT id FROM achievements WHERE code = $1`,
      [achievementCode]
    );
    
    if (achievement.rows.length > 0) {
      await query(
        `INSERT INTO user_achievements (user_id, achievement_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, achievement_id) DO NOTHING`,
        [userId, achievement.rows[0].id]
      );
    }
  } catch (err) {
    logger.error(`Error awarding achievement ${achievementCode}:`, err);
  }
}
