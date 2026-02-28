"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { AlertCircle, DollarSign } from "lucide-react";
import { rideApi } from "@/lib/api";
const MapComponent = dynamic(() => import("@/components/MapComponent").then((mod) => mod.MapComponent), { ssr: false });

interface ActiveRide {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  stops?: string[];            // added
  estimated_fare: number;
  final_fare?: number;
  status: string;
  driver_name?: string;
}

interface ActiveRideCardProps {
  initialActiveRide: ActiveRide | null;
}

export default function ActiveRideCard({ initialActiveRide }: ActiveRideCardProps) {
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(initialActiveRide);

  // Poll for active ride updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await rideApi.getActive();
        const ride = response.data?.data;
        
        if (ride && ride.id) {
          setActiveRide(ride);
        } else {
          setActiveRide(null);
        }
      } catch (error) {
        console.error("Error polling active ride:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  if (!activeRide) {
    return null;
  }

  const rideCost = parseFloat(String(activeRide.final_fare ?? activeRide.estimated_fare ?? 0));
  const statusColor = 
    activeRide.status === "completed" ? "text-cyber-green-500 border-cyber-green-500" :
    activeRide.status === "in_progress" ? "text-blue-400 border-blue-500" :
    activeRide.status === "accepted" ? "text-yellow-400 border-yellow-500" :
    activeRide.status === "searching" ? "text-cyber-pink-500 border-cyber-pink-500" :
    "text-cyber-purple-400 border-cyber-purple-500";

  const routeSummary = [activeRide.pickup_address]
    .concat(activeRide.stops || [])
    .concat(activeRide.dropoff_address)
    .join(" → ");

  return (
    <div className="bg-cyber-dark-800/50 border-2 border-cyber-green-500 rounded-xl p-4 shadow-neon-green-lg">
      {/* optional mini-map for drivers/riders */}
      <div className="mb-3">
        <MapComponent pickup={activeRide.pickup_address} stops={activeRide.stops || []} dropoff={activeRide.dropoff_address} />
      </div>

      <div className="flex items-start gap-3 mb-3">
        <AlertCircle className="w-5 h-5 text-cyber-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1">
          <p className="font-medium text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Active ride in progress
          </p>
          <p className="text-cyber-green-400 text-sm">
            {routeSummary}
          </p>
        </div>
        <span className={`badge text-xs capitalize border-2 ${statusColor}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {activeRide.status?.replace(/_/g, " ")}
        </span>
      </div>

      {/* Ride Details */}
      <div className="bg-cyber-purple-500/10 rounded-lg p-3 flex items-center justify-between border border-cyber-purple-500/30">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-cyber-green-500" />
          <span className="text-cyber-purple-400 text-sm">Estimated Fare</span>
        </div>
        <span className="text-cyber-green-500 font-bold text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          ${rideCost.toFixed(2)}
        </span>
      </div>

      <p className="text-cyber-purple-400 text-xs mt-3 text-center">
        {activeRide.status === 'pending' 
          ? 'Complete payment to search for drivers' 
          : activeRide.status === 'searching'
          ? 'Searching for nearby drivers...'
          : activeRide.status === 'accepted'
          ? `Driver ${activeRide.driver_name || 'assigned'} is on the way!`
          : activeRide.status === 'in_progress'
          ? `Ride in progress with ${activeRide.driver_name || 'driver'}`
          : 'Tracking your ride in real-time'}
      </p>
    </div>
  );
}
