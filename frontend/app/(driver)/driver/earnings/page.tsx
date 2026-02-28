"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Car, Star, Download } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function getToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

interface DriverStats {
  driver: {
    id: string;
    total_earnings: string;
    total_rides: string;
    rating: string;
    status: string;
  } | null;
  today: {
    today_earnings: string;
    today_rides: string;
  };
  recentRides: Array<{
    id: string;
    status: string;
    pickup_address: string;
    dropoff_address: string;
    final_fare: number;
    estimated_fare: number;
    created_at: string;
    completed_at: string | null;
    rider_name: string;
  }>;
}

export default function EarningsPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    fetch(`${BASE_URL}/rides/stats/driver`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  const totalEarnings = parseFloat(stats?.driver?.total_earnings ?? "0");
  const totalRides = parseInt(stats?.driver?.total_rides ?? "0", 10);
  const todayEarnings = parseFloat(stats?.today?.today_earnings ?? "0");
  const todayRides = parseInt(stats?.today?.today_rides ?? "0", 10);
  const avgRating = parseFloat(stats?.driver?.rating ?? "0");
  const recentRides = stats?.recentRides ?? [];
  const avgPerRide = totalRides > 0 ? (totalEarnings / totalRides).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h2 className="section-title">Earnings</h2>
        <p className="section-subtitle">Track your income and ride history.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today Earnings", value: `$${todayEarnings.toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-100" },
          { label: "Today Rides", value: todayRides.toString(), icon: Car, color: "text-blue-600 bg-blue-100" },
          { label: "Avg/Ride", value: `$${avgPerRide}`, icon: TrendingUp, color: "text-primary-600 bg-primary-100" },
          { label: "Avg Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "N/A", icon: Star, color: "text-yellow-600 bg-yellow-100" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card group hover:shadow-neon-lg transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold font-orbitron text-cyber-green-400">{value}</p>
            <p className="text-sm text-cyber-purple-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold font-orbitron text-white mb-4">Lifetime Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold font-orbitron text-cyber-green-400">${totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-cyber-purple-400">Total Earnings</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-orbitron text-cyber-green-400">{totalRides}</p>
            <p className="text-sm text-cyber-purple-400">Total Rides</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-orbitron text-cyber-green-400">{avgRating > 0 ? avgRating.toFixed(1) : "N/A"}</p>
            <p className="text-sm text-cyber-purple-400">Avg Rating</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold font-orbitron text-white">Recent Rides</h3>
          <button className="flex items-center gap-1 text-sm text-cyber-purple-400 hover:text-cyber-purple-300 hover:drop-shadow-[0_0_5px_rgba(123,63,242,0.6)] font-medium transition-all duration-300">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        {recentRides.length === 0 ? (
          <div className="text-center py-8">
            <Car className="w-10 h-10 text-cyber-purple-400 mx-auto mb-2" />
            <p className="text-cyber-purple-400 text-sm">No completed rides yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRides.map((ride) => (
              <div key={ride.id} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyber-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-cyber-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {ride.pickup_address} to {ride.dropoff_address}
                  </p>
                  <p className="text-xs text-cyber-purple-400">
                    {ride.rider_name} &bull; {new Date(ride.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold font-orbitron text-cyber-green-400">
                    ${(parseFloat(String(ride.final_fare || 0)) || parseFloat(String(ride.estimated_fare || 0)) || 0).toFixed(2)}
                  </p>
                  <span className={`badge text-xs ${ride.status === "completed" ? "badge-success" : "badge-info"}`}>
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}