"use client";
import { useState, useEffect } from "react";
import { achievementsApi } from "@/lib/features-api";
import { Trophy, Lock } from "lucide-react";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {
      const data = await achievementsApi.getAll();
      setAchievements(data);
    } catch (err) {
      console.error("Failed to load achievements:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-500" />
      </div>
    );
  }

  const categories = ['environmental', 'usage', 'safety', 'social'];
  const categoryColors: Record<string, string> = {
    environmental: 'cyber-green-500',
    usage: 'cyber-purple-500',
    safety: 'cyber-pink-500',
    social: 'yellow-500'
  };

  return (
    <div className="min-h-screen p-6 bg-cyber-dark-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyber-purple-500 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            🏆 Achievements
          </h1>
          <p className="text-cyber-purple-400">
            Unlock badges by using RideSwift! {achievements?.totalEarned || 0} of{' '}
            {achievements?.totalAvailable || 0} earned
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 card border-2 border-cyber-purple-500/30">
          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-cyber-purple-500" />
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-white font-semibold">Overall Progress</span>
                <span className="text-cyber-purple-400">
                  {achievements?.totalEarned || 0} / {achievements?.totalAvailable || 0}
                </span>
              </div>
              <div className="w-full h-3 bg-cyber-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyber-purple-500 to-cyber-green-500 transition-all duration-500"
                  style={{
                    width: `${((achievements?.totalEarned || 0) / (achievements?.totalAvailable || 1)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements by Category */}
        {categories.map((category) => {
          const categoryAchievements = achievements?.all?.filter(
            (a: any) => a.category === category
          );
          
          if (!categoryAchievements || categoryAchievements.length === 0) return null;

          return (
            <div key={category} className="mb-8">
              <h2 className={`text-2xl font-bold text-${categoryColors[category]} mb-4 capitalize`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className={`card border-2 ${
                      achievement.earned
                        ? `border-${categoryColors[category]} bg-gradient-to-br from-${categoryColors[category]}/20 to-transparent`
                        : 'border-gray-700 bg-cyber-dark-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`text-4xl ${achievement.earned ? '' : 'grayscale opacity-40'}`}>
                        {achievement.earned ? achievement.icon : '🔒'}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg ${achievement.earned ? 'text-white' : 'text-gray-500'}`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm ${achievement.earned ? 'text-gray-300' : 'text-gray-600'}`}>
                          {achievement.description}
                        </p>
                        {achievement.earned && achievement.earnedAt && (
                          <p className="text-xs text-cyber-purple-400 mt-2">
                            Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {achievement.earned && (
                        <div className="w-8 h-8 rounded-full bg-cyber-green-500 flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
