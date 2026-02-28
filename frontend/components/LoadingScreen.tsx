"use client";

import { useEffect, useState } from "react";
import { Car } from "lucide-react";

interface LoadingScreenProps {
  isLoading?: boolean;
}

export default function LoadingScreen({ isLoading = true }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) return;

    // Reset progress when loading starts
    setProgress(0);
    setIsVisible(true);

    // Smooth progress increment
    const duration = 2800; // 2.8 seconds to reach 100%
    const intervalTime = 50; // Update every 50ms
    const increment = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(interval);
          // Hide after reaching 100%
          setTimeout(() => setIsVisible(false), 200);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Reset visibility when isLoading becomes true again
  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  // Determine traffic light state based on progress
  const getTrafficLightState = () => {
    if (progress < 40) return "red";
    if (progress < 80) return "yellow";
    return "green";
  };

  const trafficState = getTrafficLightState();

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-cyber-dark-900 via-cyber-dark-800 to-cyber-dark-900 flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyber-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyber-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Road Markings */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-gradient-to-r from-transparent via-cyber-dark-700/50 to-transparent">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-around">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="w-16 h-1 bg-white/30 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Traffic Signal */}
        <div className="relative">
          <div className="w-24 h-64 bg-cyber-dark-800 rounded-3xl border-4 border-cyber-purple-500/30 shadow-2xl p-6 flex flex-col gap-6 items-center">
            {/* Red Light */}
            <div
              className={`w-14 h-14 rounded-full transition-all duration-500 ${
                trafficState === "red"
                  ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse"
                  : "bg-red-950 border-2 border-red-900/30"
              }`}
            />

            {/* Yellow Light */}
            <div
              className={`w-14 h-14 rounded-full transition-all duration-500 ${
                trafficState === "yellow"
                  ? "bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-pulse"
                  : "bg-yellow-950 border-2 border-yellow-900/30"
              }`}
            />

            {/* Green Light */}
            <div
              className={`w-14 h-14 rounded-full transition-all duration-500 ${
                trafficState === "green"
                  ? "bg-cyber-green-400 shadow-[0_0_30px_rgba(0,255,159,0.8)] animate-pulse"
                  : "bg-green-950 border-2 border-green-900/30"
              }`}
            />
          </div>

          {/* Traffic Signal Pole */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-20 bg-gradient-to-b from-cyber-dark-700 to-cyber-dark-800 shadow-lg" />
        </div>

        {/* Moving Car */}
        <div className="relative w-full max-w-2xl h-32 overflow-hidden">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-300 ease-linear"
            style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
          >
            <div className="relative">
              {/* Car Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple-500 to-cyber-green-500 rounded-2xl blur-xl opacity-60 animate-pulse" />
              
              {/* Car Body */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
                <Car className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: "0.5s" }} />
              </div>

              {/* Exhaust Smoke */}
              {progress > 10 && (
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-white/30 rounded-full animate-ping"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: "1s",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Counter */}
        <div className="text-center space-y-4">
          {/* Percentage Display */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple-500 to-cyber-green-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-cyber-dark-800/90 backdrop-blur-xl border-2 border-cyber-purple-500/50 rounded-3xl px-12 py-6 shadow-2xl">
              <div className="text-7xl font-bold font-orbitron bg-gradient-to-r from-cyber-purple-400 via-cyber-pink-400 to-cyber-green-400 bg-clip-text text-transparent animate-gradient-x">
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-2">
            <p className="text-2xl font-bold font-orbitron text-white">
              {progress < 40 && "Getting Ready..."}
              {progress >= 40 && progress < 80 && "Almost There..."}
              {progress >= 80 && progress < 100 && "Starting Your Ride..."}
              {progress >= 100 && "Let's Go! 🚀"}
            </p>
            <p className="text-sm text-white/60">
              {trafficState === "red" && "🔴 Preparing your experience"}
              {trafficState === "yellow" && "🟡 Loading content"}
              {trafficState === "green" && "🟢 Ready to roll"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-96 max-w-full mx-auto">
            <div className="h-3 bg-cyber-dark-700 rounded-full overflow-hidden border border-cyber-purple-500/30">
              <div
                className="h-full bg-gradient-to-r from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Brand */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyber-purple-500 via-cyber-pink-500 to-cyber-green-500 rounded-xl flex items-center justify-center shadow-xl">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-orbitron bg-gradient-to-r from-cyber-purple-400 via-cyber-pink-400 to-cyber-green-400 bg-clip-text text-transparent">
              RideSwift
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
