"use client";

import { useState } from "react";
import { User, Lock, Bell, Shield, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  const handleSignOut = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    toast.success("Signed out successfully");
    router.push("/sign-in");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title">Settings</h2>
        <p className="section-subtitle">Manage your driver account and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 border-2 ${
                activeTab === tab.id
                  ? "bg-cyber-purple-500 text-white border-cyber-purple-500 shadow-neon"
                  : "bg-cyber-dark-800 text-cyber-purple-400 border-cyber-purple-500/30 hover:border-cyber-purple-500/60"
              }`}
              style={{ fontFamily: activeTab === tab.id ? 'Orbitron, sans-serif' : undefined }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "profile" && (
        <div className="card">
          <h3 className="text-lg font-semibold font-orbitron text-white mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyber-purple-400 mb-1">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  className="input-field"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="input-field"
                  disabled
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                className="input-field"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Phone</label>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                className="input-field"
                disabled
              />
            </div>
            <p className="text-sm text-cyber-purple-400 italic">
              Profile editing coming soon. Contact support to update your information.
            </p>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="card">
          <h3 className="text-lg font-semibold font-orbitron text-white mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                disabled
              />
            </div>
            <p className="text-sm text-cyber-purple-400 italic">
              Password change functionality coming soon.
            </p>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="card">
          <h3 className="text-lg font-semibold font-orbitron text-white mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: "New Ride Requests", description: "Get notified when a rider requests a ride nearby" },
              { label: "Earnings Updates", description: "Daily summary of your earnings" },
              { label: "Ride Ratings", description: "Notifications when riders rate your service" },
              { label: "System Announcements", description: "Important updates from RideSwift" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-cyber-dark-800/50 rounded-xl border border-cyber-purple-500/30">
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-sm text-cyber-purple-400">{item.description}</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                  <div className="w-full h-full bg-cyber-dark-700 peer-checked:bg-cyber-green-500 rounded-full transition-colors cursor-not-allowed opacity-50"></div>
                  <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
              </div>
            ))}
            <p className="text-sm text-cyber-purple-400 italic">
              Notification settings coming soon.
            </p>
          </div>
        </div>
      )}

      {activeTab === "privacy" && (
        <div className="card">
          <h3 className="text-lg font-semibold font-orbitron text-white mb-4">Privacy & Data</h3>
          <div className="space-y-4">
            <div className="p-4 bg-cyber-dark-800/50 rounded-xl border border-cyber-purple-500/30">
              <p className="font-medium text-white mb-2">Location Tracking</p>
              <p className="text-sm text-cyber-purple-400 mb-3">
                We use your location to match you with nearby riders and provide navigation.
              </p>
              <button className="btn-secondary" disabled>
                Manage Location Settings
              </button>
            </div>
            <div className="p-4 bg-cyber-dark-800/50 rounded-xl border border-cyber-purple-500/30">
              <p className="font-medium text-white mb-2">Data Sharing</p>
              <p className="text-sm text-cyber-purple-400 mb-3">
                Control what information is shared with riders during rides.
              </p>
              <button className="btn-secondary" disabled>
                Configure Sharing
              </button>
            </div>
            <p className="text-sm text-cyber-purple-400 italic">
              Privacy controls coming soon.
            </p>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className="card border-2 border-cyber-pink-500/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold font-orbitron text-white">Sign Out</h3>
            <p className="text-sm text-cyber-purple-400 mt-1">
              Sign out of your driver account
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyber-pink-500 text-white font-semibold rounded-xl hover:bg-cyber-pink-600 transition-colors shadow-neon-pink"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
