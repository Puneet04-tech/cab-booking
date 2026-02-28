import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import Link from "next/link";
import {
  MapPin, Clock, CreditCard, Star, TrendingUp,
  Car, ArrowRight, AlertCircle
} from "lucide-react";
import ActiveRideCard from "@/components/shared/ActiveRideCard";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:5000";

async function fetchWithToken(path: string, token: string) {
  try {
    const res = await fetch(`${BACKEND}/api${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value ?? "";

  let firstName = "Rider";
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET ?? "rideswift_super_secret_jwt_key_2026"
      );
      const { payload } = await jwtVerify(token, secret);
      firstName = (payload as { firstName?: string }).firstName ?? "Rider";
    } catch { /* ignore */ }
  }

  const [statsData, activeRideData] = await Promise.all([
    fetchWithToken("/rides/stats/rider", token),
    fetchWithToken("/rides/active", token),
  ]);

  const stats = statsData?.data?.stats ?? { total_rides: 0, completed_rides: 0, total_spent: "0", total_saved: "0" };
  const recentRides: Array<{
    id: string; status: string; pickup_address: string;
    dropoff_address: string; estimated_fare: number; final_fare: number;
    created_at: string; driver_name?: string;
  }> = statsData?.data?.recentRides ?? [];
  const activeRide = activeRideData?.data ?? null;

  // Calculate total spent including pending ride
  let totalSpent = parseFloat(stats.total_spent ?? "0");
  if (activeRide && activeRide.status !== "cancelled") {
    const activeRideCost = parseFloat(String(activeRide.estimated_fare || 0));
    totalSpent += activeRideCost;
  }

  const statCards = [
    { label: "Total Rides", value: stats.total_rides?.toString() ?? "0", icon: Car, color: "bg-blue-100 text-blue-600" },
    { label: "Completed Rides", value: stats.completed_rides?.toString() ?? "0", icon: Star, color: "bg-yellow-100 text-yellow-600" },
    { label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, icon: CreditCard, color: "bg-green-100 text-green-600" },
    { label: "Saved with Promos", value: `$${parseFloat(stats.total_saved ?? "0").toFixed(2)}`, icon: TrendingUp, color: "bg-primary-100 text-primary-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-cyber-purple-500 via-cyber-purple-600 to-cyber-pink-500 rounded-xl p-6 border-2 border-cyber-purple-500 shadow-neon-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-dark-900/20" />
        <div className="relative">
          <p className="text-cyber-green-500 text-sm mb-1" style={{ textShadow: '0 0 10px rgba(0, 255, 159, 0.7)', fontFamily: 'Orbitron, sans-serif' }}>Good day,</p>
          <h2 className="text-2xl font-bold mb-1 text-cyber-green-500" style={{ textShadow: '0 0 20px rgba(0, 255, 159, 0.8)', fontFamily: 'Orbitron, sans-serif' }}>{firstName} </h2>
          <p className="text-cyber-green-400 text-sm">Where would you like to go today?</p>
          <Link
            href="/booking"
            className="mt-4 inline-flex items-center gap-2 bg-cyber-green-500 text-cyber-dark-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-cyber-green-600 transition-all duration-300 text-sm shadow-neon-green border-2 border-cyber-green-500"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            <MapPin className="w-4 h-4" /> Book a Ride <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card hover:shadow-neon transition-all duration-300">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-cyber-purple-500/20 border border-cyber-purple-500 shadow-neon">
              <Icon className="w-5 h-5 text-cyber-green-500" />
            </div>
            <p className="text-2xl font-bold text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(0, 255, 159, 0.5)' }}>{value}</p>
            <p className="text-cyber-purple-400 text-sm mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Active Ride Alert */}
      {activeRide ? (
        <ActiveRideCard initialActiveRide={activeRide} />
      ) : (
        <div className="bg-cyber-dark-800/50 border-2 border-cyber-purple-500 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-cyber-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-cyber-purple-600" style={{ fontFamily: 'Orbitron, sans-serif' }}>No active ride</p>
            <p className="text-cyber-green-500 text-sm">You don&apos;t have an ongoing ride. Book one now!</p>
          </div>
          <Link href="/booking" className="ml-auto btn-primary !py-1.5 !px-4 text-sm flex-shrink-0">
            Book
          </Link>
        </div>
      )}

      {/* Recent Rides */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cyber-purple-600" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(123, 63, 242, 0.7)' }}>Recent Rides</h3>
          <Link href="/history" className="text-cyber-green-500 text-sm font-medium hover:text-cyber-green-400 flex items-center gap-1 transition-colors" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentRides.length === 0 ? (
          <div className="card text-center py-10">
            <Car className="w-12 h-12 text-cyber-purple-500/50 mx-auto mb-3" />
            <p className="text-cyber-green-500/70">No rides yet. Book your first ride!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRides.map((ride) => (
              <div key={ride.id} className="card-hover flex items-center gap-4">
                <div className="w-12 h-12 bg-cyber-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyber-purple-500">
                  <Car className="w-6 h-6 text-cyber-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge text-xs ${ride.status === "completed" ? "badge-success" : ride.status === "cancelled" ? "badge-danger" : "badge-info"}`}>
                      {ride.status}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(ride.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-cyber-green-500/70 truncate">
                    <MapPin className="w-3.5 h-3.5 text-cyber-green-500 flex-shrink-0" />
                    <span className="truncate">{ride.pickup_address}</span>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{ride.dropoff_address}</span>
                  </div>
                  {ride.driver_name && (
                    <p className="text-xs text-cyber-purple-400 mt-0.5">Driver: {ride.driver_name.trim() || "Unassigned"}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    ${(parseFloat(String(ride.final_fare || 0)) || parseFloat(String(ride.estimated_fare || 0)) || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-cyber-purple-600 mb-4" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(123, 63, 242, 0.7)' }}>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Book a Ride", href: "/booking", icon: MapPin },
            { label: "Ride History", href: "/history", icon: Clock },
            { label: "My Wallet", href: "/payment", icon: CreditCard },
            { label: "Support", href: "/support", icon: Star },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="card-hover text-center group hover:border-cyber-purple-500 hover:shadow-neon transition-all duration-300">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 bg-cyber-purple-500/20 border border-cyber-purple-500 group-hover:shadow-neon">
                <Icon className="w-6 h-6 text-cyber-green-500" />
              </div>
              <p className="text-sm font-medium text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}