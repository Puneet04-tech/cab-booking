"use client";
import { useState } from "react";
import { Car, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid email or password.");
        setLoading(false);
        return;
      }
      // Store JWT in a cookie (7-day expiry)
      document.cookie = `auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
      
      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      
      if (redirect) {
        // Use the redirect parameter if it exists
        window.location.href = redirect;
      } else {
        // Otherwise redirect based on role
        const role = data.user?.role ?? "rider";
        window.location.href = role === "driver" ? "/driver/dashboard" : "/dashboard";
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cyber-dark-900 cyber-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyber-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyber-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 bg-cyber-purple-500 rounded-lg flex items-center justify-center shadow-neon group-hover:shadow-neon-lg transition-all duration-300">
              <Car className="w-6 h-6 text-cyber-green-500" />
            </div>
            <span className="text-2xl font-bold text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px rgba(0, 255, 159, 0.8)' }}>RideSwift</span>
          </Link>
          <p className="text-cyber-purple-400">Welcome back! Sign in to continue.</p>
        </div>

        <div className="card shadow-neon-lg border-2 border-cyber-purple-500">
          <h2 className="text-2xl font-bold text-cyber-purple-600 mb-6" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(123, 63, 242, 0.7)' }}>Sign in</h2>

          {error && (
            <div className="mb-4 p-3 bg-cyber-pink-500/20 border-2 border-cyber-pink-500 rounded-lg text-cyber-pink-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-purple-400 hover:text-cyber-green-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cyber-purple-400">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-cyber-green-500 hover:text-cyber-green-400 font-semibold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
