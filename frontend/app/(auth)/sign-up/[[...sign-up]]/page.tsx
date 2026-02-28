"use client";
import { useState, useEffect } from "react";
import { Car, Eye, EyeOff, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "driver" ? "driver" : "rider";
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"rider" | "driver">(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");

  // Request location for drivers
  const requestLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError("");
      },
      (error) => {
        setLocationError("Unable to get your location. Please enable location access.");
        console.error("Location error:", error);
      }
    );
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    
    // Validate driver location
    if (role === "driver" && !location) {
      setError("Drivers must enable location access to register.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const body: any = { firstName, lastName, email, password, role };
      if (role === "driver" && location) {
        body.lat = location.lat;
        body.lng = location.lng;
      }
      
      const res = await fetch(`${BACKEND}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
      document.cookie = `auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      const userRole = data.user?.role ?? role;
      window.location.href = userRole === "driver" ? "/driver/dashboard" : "/dashboard";
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cyber-dark-900 cyber-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyber-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyber-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 bg-cyber-purple-500 rounded-lg flex items-center justify-center shadow-neon group-hover:shadow-neon-lg transition-all duration-300">
              <Car className="w-6 h-6 text-cyber-green-500" />
            </div>
            <span className="text-2xl font-bold text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px rgba(0, 255, 159, 0.8)' }}>RideSwift</span>
          </Link>
          <p className="text-cyber-purple-400">
            {role === "driver" 
              ? "Join our driver community and start earning today." 
              : "Create your account and start riding today."}
          </p>
        </div>

        <div className="card shadow-neon-lg border-2 border-cyber-purple-500">
          {error && (
            <div className="mb-4 p-3 bg-cyber-pink-500/20 border-2 border-cyber-pink-500 rounded-lg text-cyber-pink-500 text-sm">
              {error}
            </div>
          )}

          <h2 className="text-2xl font-bold text-cyber-purple-600 mb-6" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(123, 63, 242, 0.7)' }}>Create account</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-cyber-purple-400 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>First name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyber-purple-400 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole("rider");
                    setLocation(null);
                    setLocationError("");
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                    role === "rider"
                      ? "bg-cyber-purple-500 text-white border-cyber-purple-500 shadow-neon"
                      : "bg-cyber-dark-800 text-cyber-purple-400 border-cyber-purple-500/30 hover:border-cyber-purple-500/60"
                  }`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  🚗 Rider
                </button>
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                    role === "driver"
                      ? "bg-cyber-green-500 text-cyber-dark-900 border-cyber-green-500 shadow-neon-green"
                      : "bg-cyber-dark-800 text-cyber-green-400 border-cyber-green-500/30 hover:border-cyber-green-500/60"
                  }`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  👤 Driver
                </button>
              </div>
            </div>

            {role === "driver" && (
              <div>
                <label className="block text-sm font-medium text-cyber-purple-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Location Access (Required for Drivers)
                </label>
                <button
                  type="button"
                  onClick={requestLocation}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 flex items-center justify-center gap-2 ${
                    location
                      ? "bg-cyber-green-500/20 border-cyber-green-500 text-cyber-green-400"
                      : "bg-cyber-dark-800 border-cyber-purple-500/50 text-cyber-purple-400 hover:border-cyber-purple-500"
                  }`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <MapPin className="w-4 h-4" />
                  {location ? "✓ Location Access Granted" : "Enable Location Access"}
                </button>
                {locationError && (
                  <p className="mt-2 text-xs text-cyber-pink-400">{locationError}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-purple-400 hover:text-cyber-purple-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating accountâ€¦" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cyber-purple-400">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-cyber-green-400 hover:text-cyber-green-300 hover:drop-shadow-[0_0_8px_rgba(0,255,159,0.6)] font-semibold transition-all duration-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

