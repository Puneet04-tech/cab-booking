"use client";
import { useState, useEffect } from "react";
import { carbonApi } from "@/lib/features-api";
import { Leaf, TreeDeciduous, TrendingDown, Award } from "lucide-react";

export default function CarbonFootprintPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await carbonApi.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load carbon stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-cyber-dark-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyber-green-500 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            🌍 Your Environmental Impact
          </h1>
          <p className="text-cyber-purple-400">
            Track how much CO₂ you've saved by choosing ride-sharing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total CO2 Saved */}
          <div className="card border-2 border-cyber-green-500/30 bg-gradient-to-br from-cyber-dark-800 to-cyber-dark-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyber-green-500/20 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-cyber-green-500" />
              </div>
              <div>
                <p className="text-sm text-cyber-purple-400">CO₂ Saved</p>
                <p className="text-3xl font-bold text-cyber-green-500">
                  {stats?.totalCO2SavedKg?.toFixed(2) || 0} kg
                </p>
              </div>
            </div>
          </div>

          {/* Trees Equivalent */}
          <div className="card border-2 border-cyber-green-500/30 bg-gradient-to-br from-cyber-dark-800 to-cyber-dark-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyber-green-500/20 flex items-center justify-center">
                <TreeDeciduous className="w-8 h-8 text-cyber-green-500" />
              </div>
              <div>
                <p className="text-sm text-cyber-purple-400">Trees Planted Equivalent</p>
                <p className="text-3xl font-bold text-cyber-green-500">
                  {stats?.totalTreesEquivalent?.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Eco Rides */}
          <div className="card border-2 border-cyber-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyber-purple-500/20 flex items-center justify-center">
                <TrendingDown className="w-8 h-8 text-cyber-purple-500" />
              </div>
              <div>
                <p className="text-sm text-cyber-purple-400">Total Eco Rides</p>
                <p className="text-3xl font-bold text-white">
                  {stats?.totalEcoRides || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Average per ride */}
          <div className="card border-2 border-cyber-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyber-purple-500/20 flex items-center justify-center">
                <Award className="w-8 h-8 text-cyber-purple-500" />
              </div>
              <div>
                <p className="text-sm text-cyber-purple-400">Avg CO₂ per Ride</p>
                <p className="text-3xl font-bold text-white">
                  {stats?.avgCO2PerRide?.toFixed(2) || 0} kg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="card border-2 border-cyber-green-500/30 bg-gradient-to-br from-cyber-green-500/10 to-transparent">
          <h3 className="text-xl font-bold text-cyber-green-500 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            💡 Did You Know?
          </h3>
          <div className="space-y-3 text-cyber-purple-300">
            <p>• One tree absorbs about 21 kg of CO₂ per year</p>
            <p>• Ride-sharing reduces emissions by up to 75% compared to driving alone</p>
            <p>• Auto rickshaws are the most eco-friendly option, saving the most CO₂</p>
            <p>• Every kilometer you share is a step towards a cleaner planet 🌱</p>
          </div>
        </div>

        {stats?.totalCO2SavedKg >= 50 && (
          <div className="mt-6 card border-2 border-cyber-green-500 bg-cyber-green-500/10">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏆</span>
              <div>
                <h4 className="font-bold text-cyber-green-500 text-lg">Eco Warrior Achievement Unlocked!</h4>
                <p className="text-cyber-purple-300">
                  You've saved over 50kg of CO₂ emissions. Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
