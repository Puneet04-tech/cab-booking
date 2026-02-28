"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { DollarSign, Car, Star, Clock, Check, X, Navigation, Phone, Wifi, WifiOff } from "lucide-react";
const MapComponent = dynamic(() => import("@/components/MapComponent").then((mod) => mod.MapComponent), { ssr: false });
import toast from "react-hot-toast";
import { rideApi, driverApi } from "@/lib/api";

interface AvailableRide {
  id: string;
  rider_name: string;
  rider_rating: number;
  pickup_address: string;
  dropoff_address: string;
  estimated_fare: number;
  distance_km: number | null;
  ride_type: string;
  created_at: string;
}

interface ActiveRide {
  id: string;
  rider_name: string;
  rider_phone: string | null;
  pickup_address: string;
  stops?: string[];
  dropoff_address: string;
  estimated_fare: number;
  status: string;
}

interface DriverStats {
  driver: { id: string; status: string; rating: string; total_rides: string; total_earnings: string } | null;
  today: { today_earnings: string; today_rides: string };
  recentRides: { id: string; rider_name: string; pickup_address: string; dropoff_address: string; final_fare: number | null; estimated_fare: number; status: string; created_at: string }[];
}

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>([]);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await rideApi.getDriverStats();
      setStats(res.data.data);
    } catch { /* ignore */ }
  }, []);

  const fetchActiveRide = useCallback(async () => {
    try {
      const res = await rideApi.getDriverActive();
      setActiveRide(res.data.data ?? null);
    } catch { /* ignore */ }
  }, []);

  const fetchAvailableRides = useCallback(async () => {
    if (!isOnline) return;
    try {
      const res = await rideApi.getAvailable();
      setAvailableRides(res.data.data ?? []);
    } catch { /* ignore */ }
  }, [isOnline]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchActiveRide();
  }, [fetchStats, fetchActiveRide]);

  // Poll for available rides + active ride every 15 seconds when online
  useEffect(() => {
    if (!isOnline) {
      setAvailableRides([]);
      return;
    }
    fetchAvailableRides();
    const interval = setInterval(() => {
      fetchAvailableRides();
      fetchActiveRide();
    }, 15000); // Increased to 15 seconds to avoid rate limiting
    return () => clearInterval(interval);
  }, [isOnline, fetchAvailableRides, fetchActiveRide]);

  const toggleOnline = async () => {
    setIsTogglingStatus(true);
    try {
      await driverApi.toggleStatus(isOnline ? "offline" : "online");
      setIsOnline((prev) => !prev);
      toast.success(isOnline ? "You are now offline" : "You are now online and receiving rides!");
      if (isOnline) setAvailableRides([]);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleAccept = async (rideId: string) => {
    setActionLoadingId(rideId);
    try {
      await driverApi.acceptRide(rideId);
      setAvailableRides((prev) => prev.filter((r) => r.id !== rideId));
      await fetchActiveRide();
      await fetchStats();
      toast.success("Ride accepted! Navigate to pickup.");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to accept ride");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (rideId: string) => {
    setActionLoadingId(rideId);
    try {
      await driverApi.declineRide(rideId);
      setAvailableRides((prev) => prev.filter((r) => r.id !== rideId));
      toast("Ride declined", { icon: "ðŸ‘‹" });
    } catch {
      toast.error("Failed to decline ride");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartRide = async () => {
    if (!activeRide) return;
    setActionLoadingId(activeRide.id);
    try {
      await driverApi.startRide(activeRide.id);
      await fetchActiveRide();
      toast.success("Ride started!");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to start ride");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async () => {
    if (!activeRide) return;
    setActionLoadingId(activeRide.id);
    try {
      await driverApi.completeRide(activeRide.id);
      setActiveRide(null);
      await fetchStats();
      toast.success("Ride completed! Payment received.");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to complete ride");
    } finally {
      setActionLoadingId(null);
    }
  };

  const todayStats = [
    {
      label: "Today's Earnings",
      value: `$${parseFloat(stats?.today?.today_earnings ?? "0").toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: "Rides Today",
      value: stats?.today?.today_rides?.toString() ?? "0",
      icon: Car,
    },
    {
      label: "Avg. Rating",
      value: stats?.driver?.rating ?? "â€”",
      icon: Star,
    },
    {
      label: "Total Rides",
      value: stats?.driver?.total_rides?.toString() ?? "0",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Driver Dashboard</h2>
          <p className="section-subtitle">Manage your rides and track your earnings.</p>
        </div>
        <button
          onClick={toggleOnline}
          disabled={isTogglingStatus}
          className={`flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm ${
            isOnline
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-cyber-dark-800 text-cyber-purple-400 hover:bg-cyber-dark-700 border border-cyber-purple-500/30"
          }`}
        >
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {isTogglingStatus ? "Updatingâ€¦" : isOnline ? "Online" : "Go Online"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {todayStats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card group hover:shadow-neon-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-cyber-green-500/20">
              <Icon className="w-5 h-5 text-cyber-green-400 group-hover:text-cyber-green-300 transition-colors" />
            </div>
            <p className="text-2xl font-bold font-orbitron text-cyber-green-400">{value}</p>
            <p className="text-sm text-cyber-purple-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Active Ride In-Progress */}
      {activeRide && (
        <div className="card border-2 border-primary-200 space-y-4">
          <div className="flex items-center gap-2">
            <span className="badge badge-info animate-pulse">{activeRide.status.replace(/_/g, " ")}</span>
            <span className="text-sm text-gray-500">Active Ride</span>
          </div>

          {/* route map */}
          <div className="mb-3">
            <MapComponent
              pickup={activeRide.pickup_address}
              stops={activeRide.stops || []}
              dropoff={activeRide.dropoff_address}
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Rider</span>
              <span className="font-medium">{activeRide.rider_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pickup</span>
              <span className="font-medium text-right max-w-[60%]">{activeRide.pickup_address}</span>
            </div>
            {activeRide.stops && activeRide.stops.length > 0 && activeRide.stops.map((s,i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-500">Stop {i+1}</span>
                <span className="font-medium text-right max-w-[60%]">{s}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-gray-500">Destination</span>
              <span className="font-medium text-right max-w-[60%]">{activeRide.dropoff_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Fare</span>
              <span className="font-bold text-primary-600">${parseFloat(String(activeRide.estimated_fare || 0)).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => {
                const destination = encodeURIComponent(activeRide.dropoff_address);
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
              }}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 !py-2.5"
            >
              <Navigation className="w-4 h-4" /> Navigate
            </button>
            {activeRide.rider_phone && (
              <a
                href={`tel:${activeRide.rider_phone}`}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 !py-2.5"
              >
                <Phone className="w-4 h-4" /> Call Rider
              </a>
            )}
          </div>

          {activeRide.status === "accepted" && (
            <button
              onClick={handleStartRide}
              disabled={actionLoadingId === activeRide.id}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Car className="w-4 h-4" /> Start Ride (Picked up rider)
            </button>
          )}

          {activeRide.status === "in_progress" && (
            <button
              onClick={handleComplete}
              disabled={actionLoadingId === activeRide.id}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {actionLoadingId === activeRide.id ? "Completingâ€¦" : "Complete Ride"}
            </button>
          )}
        </div>
      )}

      {/* Available Ride Requests */}
      {isOnline && !activeRide && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold font-orbitron text-white">Available Rides</h3>
            <span className="text-sm text-cyber-purple-400">{availableRides.length} pending</span>
          </div>

          {availableRides.length === 0 ? (
            <div className="card text-center py-10">
              <Car className="w-12 h-12 text-cyber-purple-400 mx-auto mb-3" />
              <p className="font-medium text-white">No ride requests yet</p>
              <p className="text-sm text-cyber-purple-400 mt-1">Waiting for nearby riders to book…</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-gradient-to-r from-primary-500 to-orange-400 rounded-2xl p-5 text-white"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="font-semibold text-sm">New Ride Request</span>
                    <span className="ml-auto text-xs text-white/70 capitalize">{ride.ride_type}</span>
                  </div>

                  <div className="bg-white/20 rounded-xl p-3 mb-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Rider</span>
                      <span className="font-medium">{ride.rider_name} â­ {ride.rider_rating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Pickup</span>
                      <span className="font-medium text-right max-w-[60%]">{ride.pickup_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Drop-off</span>
                      <span className="font-medium text-right max-w-[60%]">{ride.dropoff_address}</span>
                    </div>
                    {ride.distance_km && (
                      <div className="flex justify-between">
                        <span className="text-white/70">Distance</span>
                        <span className="font-medium">{parseFloat(ride.distance_km.toString()).toFixed(1)} km</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/70">Fare</span>
                      <span className="font-bold text-lg">${parseFloat(String(ride.estimated_fare || 0)).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDecline(ride.id)}
                      disabled={actionLoadingId === ride.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5" /> Decline
                    </button>
                    <button
                      onClick={() => handleAccept(ride.id)}
                      disabled={actionLoadingId === ride.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-white text-primary-600 font-bold py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                      {actionLoadingId === ride.id ? "Acceptingâ€¦" : "Accept"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isOnline && !activeRide && (
        <div className="card text-center py-10">
          <WifiOff className="w-12 h-12 text-cyber-purple-400 mx-auto mb-3" />
          <p className="font-medium text-white">You are offline</p>
          <p className="text-sm text-cyber-purple-400 mt-1">Go online to start receiving ride requests.</p>
          <button onClick={toggleOnline} className="btn-primary mt-4">Go Online</button>
        </div>
      )}

      {/* Recent Rides */}
      {(stats?.recentRides?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Rides</h3>
          <div className="space-y-3">
            {stats!.recentRides.map((ride) => (
              <div key={ride.id} className="card-hover flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{ride.rider_name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {ride.pickup_address} â†’ {ride.dropoff_address}
                  </p>
                  <p className="text-xs text-cyber-purple-400">
                    {new Date(ride.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">
                    ${(parseFloat(String(ride.final_fare || 0)) || parseFloat(String(ride.estimated_fare || 0)) || 0).toFixed(2)}
                  </p>
                  <span className={`text-xs ${ride.status === "completed" ? "text-cyber-green-400" : "text-cyber-purple-400"}`}>
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
