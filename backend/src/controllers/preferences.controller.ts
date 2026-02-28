import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Get user's ride preferences
export async function getRidePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    const result = await query<{
      music_preference: string;
      temperature: string;
      conversation: string;
      pet_friendly: boolean;
      accessibility_needs: string[];
    }>(
      `SELECT music_preference, temperature, conversation, pet_friendly, accessibility_needs
       FROM ride_preferences WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Return defaults
      return res.json({
        musicPreference: 'no_preference',
        temperature: 'moderate',
        conversation: 'no_preference',
        petFriendly: false,
        accessibilityNeeds: []
      });
    }
    
    const prefs = result.rows[0];
    res.json({
      musicPreference: prefs.music_preference,
      temperature: prefs.temperature,
      conversation: prefs.conversation,
      petFriendly: prefs.pet_friendly,
      accessibilityNeeds: prefs.accessibility_needs || []
    });
  } catch (err) {
    next(err);
  }
}

// Update ride preferences
export async function updateRidePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { musicPreference, temperature, conversation, petFriendly, accessibilityNeeds } = req.body;
    
    await query(
      `INSERT INTO ride_preferences 
       (user_id, music_preference, temperature, conversation, pet_friendly, accessibility_needs)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         music_preference = EXCLUDED.music_preference,
         temperature = EXCLUDED.temperature,
         conversation = EXCLUDED.conversation,
         pet_friendly = EXCLUDED.pet_friendly,
         accessibility_needs = EXCLUDED.accessibility_needs,
         updated_at = NOW()`,
      [
        userId,
        musicPreference || 'no_preference',
        temperature || 'moderate',
        conversation || 'no_preference',
        petFriendly || false,
        accessibilityNeeds || []
      ]
    );
    
    res.json({ message: "Preferences updated successfully" });
  } catch (err) {
    next(err);
  }
}
