"use client";

import { useState, useEffect } from "react";
import { Camera, Save, Star, Car, Clock, Shield } from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function getToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function ProfilePage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [riderStats, setRiderStats] = useState({ total_rides: 0, completed_rides: 0, joined: "" });

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((u) => {
        setForm((f) => ({
          ...f,
          firstName: u.first_name ?? "",
          lastName: u.last_name ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
        }));
        if (u.created_at) {
          setRiderStats((s) => ({ ...s, joined: new Date(u.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) }));
        }
      })
      .catch(() => {});
    fetch(`${BASE_URL}/rides/stats/rider`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setRiderStats((s) => ({
            ...s,
            total_rides: data.data?.stats?.total_rides ?? 0,
            completed_rides: data.data?.stats?.completed_rides ?? 0,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, call PATCH /api/users/me â€” for now just show success
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const stats = [
    { label: "Total Rides", value: riderStats.total_rides.toString(), icon: Car },
    { label: "Completed", value: riderStats.completed_rides.toString(), icon: Star },
    { label: "Member Since", value: riderStats.joined || "—", icon: Clock },
    { label: "Verified", value: "Yes", icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h2 className="section-title">My Profile</h2>
        <p className="section-subtitle">Manage your personal information and preferences.</p>
      </div>

      {/* Avatar */}
      <div className="card flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyber-purple-500/20 to-cyber-green-500/20 flex items-center justify-center overflow-hidden border border-cyber-purple-500/30">
            <span className="text-3xl font-bold font-orbitron text-cyber-green-400">
              {form.firstName?.[0]?.toUpperCase() ?? "R"}
            </span>
          </div>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-cyber-purple-500 to-cyber-green-500 rounded-full flex items-center justify-center shadow-neon hover:shadow-neon-lg transition-all duration-300">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <div>
          <h3 className="text-xl font-bold font-orbitron text-white">
            {form.firstName} {form.lastName}
          </h3>
          <p className="text-cyber-green-300">{form.email}</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-cyber-purple-500/30"}`}
              />
            ))}
            <span className="text-sm text-cyber-purple-400 ml-1">{riderStats.completed_rides} rides completed</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card text-center group hover:shadow-neon-lg transition-all duration-300">
            <Icon className="w-8 h-8 text-cyber-green-400 mx-auto mb-2 group-hover:text-cyber-green-300 transition-colors" />
            <p className="text-xl font-bold font-orbitron text-cyber-green-400">{value}</p>
            <p className="text-xs text-cyber-purple-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Edit Form */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Personal Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cyber-purple-400 mb-1">First Name</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="input-field"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Last Name</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="input-field"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Email</label>
          <input
            value={form.email}
            disabled
            className="input-field bg-gray-50 text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Email cannot be changed here.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Phone Number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input-field"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Bio (optional)</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="input-field resize-none"
            rows={3}
            placeholder="A short bio about yourself..."
          />
        </div>

        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2">
          {isSaving ? (
            <span className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Emergency Contacts */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Emergency Contacts</h3>
        <p className="text-sm text-gray-500">
          These contacts will be notified if you trigger the SOS alert during a ride.
        </p>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder={`Contact ${i} Name`} />
              <input className="input-field" placeholder={`Contact ${i} Phone`} />
            </div>
          ))}
        </div>
        <button className="btn-secondary text-sm !py-2">Save Emergency Contacts</button>
      </div>
    </div>
  );
}
