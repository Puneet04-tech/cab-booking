"use client";

import { useState, useEffect } from "react";
import {
  MapPin, ArrowRight, Star, Download, Search, Filter, Car, Loader2
} from "lucide-react";
import RatingModal from "@/components/shared/RatingModal";
import ReceiptModal from "@/components/shared/ReceiptModal";
import { rideApi, reviewApi } from "@/lib/api";

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  ride_type: string;
  estimated_fare: number;
  final_fare: number | null;
  created_at: string;
  completed_at: string | null;
  distance_km: string | null;
  duration_minutes: number | null;
  driver_name: string | null;
  payment_method: string;
}

export default function HistoryPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [ratingModal, setRatingModal] = useState<{ rideId: string; driverName: string } | null>(null);
  const [receiptModal, setReceiptModal] = useState<string | null>(null);
  const [ratedRides, setRatedRides] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      rideApi.getHistory(1, 50),
      reviewApi.getMyReviewedRides()
    ])
      .then(([ridesRes, reviewsRes]) => {
        setRides(ridesRes.data.data ?? []);
        const reviewedRideIds = reviewsRes.data.data ?? [];
        setRatedRides(new Set(reviewedRideIds));
      })
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rides.filter((r) => {
    const matchSearch =
      r.pickup_address.toLowerCase().includes(search.toLowerCase()) ||
      r.dropoff_address.toLowerCase().includes(search.toLowerCase()) ||
      (r.driver_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const completedRides = rides.filter((r) => r.status === "completed");
  const totalSpent = completedRides.reduce((sum, r) => sum + parseFloat(String(r.final_fare ?? r.estimated_fare ?? 0)), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title">Ride History</h2>
        <p className="section-subtitle">View all your past rides and receipts.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Rides", value: rides.length.toString() },
          { label: "Completed", value: completedRides.length.toString() },
          { label: "Total Spent", value: `$${totalSpent.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center group hover:shadow-neon-lg transition-all duration-300">
            <p className="text-2xl font-bold font-orbitron text-cyber-green-400 drop-shadow-[0_0_10px_rgba(0,255,159,0.5)] group-hover:text-cyber-green-300">{value}</p>
            <p className="text-sm text-cyber-purple-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location or driverâ€¦"
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-purple-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field pl-9 pr-8 appearance-none"
          >
            <option value="all">All Rides</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="searching">Searching</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Ride List */}
      {loading ? (
        <div className="card text-center py-12">
          <Loader2 className="w-8 h-8 text-cyber-purple-500 mx-auto mb-3 animate-spin" />
          <p className="text-cyber-purple-400">Loading your ride history…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <Car className="w-12 h-12 text-cyber-purple-400 mx-auto mb-3" />
              <p className="text-cyber-purple-400">{rides.length === 0 ? "No rides yet. Book your first ride!" : "No rides match your search."}</p>
            </div>
          ) : (
            filtered.map((ride) => {
              const fare = (ride.final_fare ?? ride.estimated_fare ?? 0);
              const dateStr = new Date(ride.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });
              const timeStr = new Date(ride.created_at).toLocaleTimeString("en-US", {
                hour: "numeric", minute: "2-digit",
              });
              const isRated = ratedRides.has(ride.id);

              return (
                <div key={ride.id} className="card-hover">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-cyber-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`badge text-xs ${
                            ride.status === "completed" ? "badge-success" : 
                            ride.status === "cancelled" ? "badge-danger" : 
                            ride.status === "in_progress" ? "border-2 border-blue-500 text-blue-400" :
                            ride.status === "accepted" ? "border-2 border-yellow-500 text-yellow-400" :
                            ride.status === "searching" ? "border-2 border-cyber-pink-500 text-cyber-pink-400" :
                            ride.status === "pending" ? "badge-warning" :
                            "badge-info"
                          }`}>
                            {ride.status}
                          </span>
                          <span className="text-xs text-cyber-purple-400 capitalize">{ride.ride_type}</span>
                        </div>
                        <p className="text-xs text-cyber-purple-500 mt-0.5">{dateStr} · {timeStr}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-orbitron text-cyber-green-400">${parseFloat(String(fare)).toFixed(2)}</p>
                      {ride.status === "completed" && (
                        <button 
                          onClick={() => setReceiptModal(ride.id)}
                          className="text-xs text-cyber-purple-400 hover:text-cyber-purple-300 hover:drop-shadow-[0_0_5px_rgba(123,63,242,0.5)] flex items-center gap-1 mt-1 transition-all duration-300"
                        >
                          <Download className="w-3 h-3" /> Receipt
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-cyber-green-300 mb-3 pl-13">
                    <MapPin className="w-3.5 h-3.5 text-cyber-green-400 flex-shrink-0" />
                    <span className="truncate">{ride.pickup_address}</span>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-cyber-purple-400" />
                    <MapPin className="w-3.5 h-3.5 text-cyber-pink-400 flex-shrink-0" />
                    <span className="truncate">{ride.dropoff_address}</span>
                  </div>

                  {ride.status === "completed" && (
                    <div className="flex items-center justify-between pt-3 border-t border-cyber-purple-500/20">
                      <div className="flex items-center gap-4 text-xs text-cyber-purple-400">
                        {ride.distance_km && <span>ðŸ§­ {parseFloat(ride.distance_km).toFixed(1)} km</span>}
                        {ride.duration_minutes && <span>â± {ride.duration_minutes} min</span>}
                        {ride.driver_name && ride.driver_name.trim() && (
                          <span>ðŸ‘¤ {ride.driver_name.trim()}</span>
                        )}
                      </div>
                      {!isRated && ride.driver_name && ride.driver_name.trim() ? (
                        <button
                          onClick={() => setRatingModal({ rideId: ride.id, driverName: ride.driver_name! })}
                          className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 hover:drop-shadow-[0_0_5px_rgba(250,204,21,0.6)] font-medium transition-all duration-300"
                        >
                          <Star className="w-3.5 h-3.5" /> Rate Driver
                        </button>
                      ) : isRated ? (
                        <span className="text-xs text-cyber-purple-400 flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Rated
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {ratingModal && (
        <RatingModal
          rideId={ratingModal.rideId}
          driverName={ratingModal.driverName}
          onClose={() => {
            setRatedRides((prev) => new Set([...Array.from(prev), ratingModal.rideId]));
            setRatingModal(null);
          }}
        />
      )}

      {receiptModal && (
        <ReceiptModal
          rideId={receiptModal}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </div>
  );
}
