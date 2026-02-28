import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Get user's achievements
export async function getUserAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    const result = await query<{
      achievement_id: string;
      code: string;
      name: string;
      description: string;
      icon: string;
      category: string;
      earned_at: string;
    }>(
      `SELECT ua.achievement_id, a.code, a.name, a.description, a.icon, a.category, ua.earned_at
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [userId]
    );
    
    const achievements = result.rows.map(a => ({
      id: a.achievement_id,
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      earnedAt: a.earned_at
    }));
    
    // Get all available achievements
    const allResult = await query<{
      id: string;
      code: string;
      name: string;
      description: string;
      icon: string;
      category: string;
    }>(
      `SELECT id, code, name, description, icon, category FROM achievements ORDER BY category, name`
    );
    
    const allAchievements = allResult.rows.map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      earned: achievements.some(ua => ua.id === a.id)
    }));
    
    res.json({
      earned: achievements,
      all: allAchievements,
      totalEarned: achievements.length,
      totalAvailable: allAchievements.length
    });
  } catch (err) {
    next(err);
  }
}

// Get achievement summary stats
export async function getAchievementStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    const result = await query<{
      total_achievements: string;
      environmental_badges: string;
      usage_badges: string;
      safety_badges: string;
      social_badges: string;
    }>(
      `SELECT * FROM user_achievement_summary WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        totalAchievements: 0,
        environmentalBadges: 0,
        usageBadges: 0,
        safetyBadges: 0,
        socialBadges: 0
      });
    }
    
    const stats = result.rows[0];
    res.json({
      totalAchievements: parseInt(stats.total_achievements || '0'),
      environmentalBadges: parseInt(stats.environmental_badges || '0'),
      usageBadges: parseInt(stats.usage_badges || '0'),
      safetyBadges: parseInt(stats.safety_badges || '0'),
      socialBadges: parseInt(stats.social_badges || '0')
    });
  } catch (err) {
    next(err);
  }
}
