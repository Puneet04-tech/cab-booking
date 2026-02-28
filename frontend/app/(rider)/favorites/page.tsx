"use client";
import { useState, useEffect } from "react";
import { favoritesApi } from "@/lib/features-api";
import { MapPin, Trash2, Plus, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FavoriteRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
    try {
      const data = await favoritesApi.getAll();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error("Failed to load favorite routes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this favorite route?")) return;
    
    try {
      await favoritesApi.delete(id);
      setRoutes(routes.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete route:", err);
      alert("Failed to delete route");
    }
  }

  async function handleBookFromFavorite(route: any) {
    try {
      await favoritesApi.incrementUsage(route.id);
      // Navigate to booking page with pre-filled data
      sessionStorage.setItem('favoriteRoute', JSON.stringify({
        pickup: route.pickup,
        dropoff: route.dropoff,
        rideType: route.preferredRideType
      }));
      router.push('/booking');
    } catch (err) {
      console.error("Failed to book from favorite:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-cyber-dark-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyber-purple-500 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              ⭐ Favorite Routes
            </h1>
            <p className="text-cyber-purple-400">
              Quick-book your frequently traveled routes
            </p>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem('savingFavoriteRoute', 'true');
              router.push('/booking');
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
        </div>

        {routes.length === 0 ? (
          <div className="card border-2 border-cyber-purple-500/30 text-center py-12">
            <MapPin className="w-16 h-16 text-cyber-purple-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No Favorite Routes Yet</h3>
            <p className="text-cyber-purple-400 mb-6">
              Save your frequently traveled routes for one-click booking
            </p>
            <button
              onClick={() => {
                sessionStorage.setItem('savingFavoriteRoute', 'true');
                router.push('/booking');
              }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Route
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className="card border-2 border-cyber-purple-500/30 hover:border-cyber-purple-500 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-cyber-green-500 mb-3">
                      {route.routeName}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-cyber-green-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-cyber-purple-400">Pickup</p>
                          <p className="text-white">{route.pickup.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Navigation className="w-5 h-5 text-cyber-pink-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-cyber-purple-400">Dropoff</p>
                          <p className="text-white">{route.dropoff.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="px-3 py-1 rounded-full bg-cyber-purple-500/20 text-cyber-purple-400 border border-cyber-purple-500/30">
                        {route.preferredRideType || 'economy'}
                      </span>
                      <span className="text-gray-400">
                        Used {route.usageCount} {route.usageCount === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleBookFromFavorite(route)}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Book Now
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyber-pink-500/20 text-cyber-pink-400 border-2 border-cyber-pink-500/30 hover:bg-cyber-pink-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
