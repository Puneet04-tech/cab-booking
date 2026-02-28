"use client";
import { useState, useEffect } from "react";
import { preferencesApi } from "@/lib/features-api";
import { Music, Thermometer, MessageCircle, Heart, Save } from "lucide-react";

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState({
    musicPreference: 'no_preference',
    temperature: 'moderate',
    conversation: 'no_preference',
    petFriendly: false,
    accessibilityNeeds: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const data = await preferencesApi.get();
      setPreferences(data);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await preferencesApi.update(preferences);
      alert("Preferences saved successfully!");
    } catch (err) {
      console.error("Failed to save preferences:", err);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyber-purple-500 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            ⚙️ Ride Preferences
          </h1>
          <p className="text-cyber-purple-400">
            Customize your ride experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Music Preference */}
          <div className="card border-2 border-cyber-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Music className="w-6 h-6 text-cyber-purple-500" />
              <h3 className="text-xl font-bold text-white">Music</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'no_music', label: '🔇 No Music' },
                { value: 'soft', label: '🎵 Soft Music' },
                { value: 'upbeat', label: '🎸 Upbeat' },
                { value: 'radio', label: '📻 Radio' },
                { value: 'no_preference', label: '✨ No Preference' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPreferences({ ...preferences, musicPreference: option.value })}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    preferences.musicPreference === option.value
                      ? 'bg-cyber-purple-500 text-white border-cyber-purple-500 shadow-neon'
                      : 'bg-cyber-dark-800 text-cyber-purple-400 border-cyber-purple-500/30 hover:border-cyber-purple-500/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div className="card border-2 border-cyber-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Thermometer className="w-6 h-6 text-cyber-purple-500" />
              <h3 className="text-xl font-bold text-white">Temperature</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'cool', label: '❄️ Cool' },
                { value: 'moderate', label: '🌤️ Moderate' },
                { value: 'warm', label: '🔥 Warm' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPreferences({ ...preferences, temperature: option.value })}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    preferences.temperature === option.value
                      ? 'bg-cyber-purple-500 text-white border-cyber-purple-500 shadow-neon'
                      : 'bg-cyber-dark-800 text-cyber-purple-400 border-cyber-purple-500/30 hover:border-cyber-purple-500/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="card border-2 border-cyber-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-cyber-purple-500" />
              <h3 className="text-xl font-bold text-white">Conversation</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'quiet', label: '🤫 Quiet Ride' },
                { value: 'friendly', label: '😊 Friendly Chat' },
                { value: 'no_preference', label: '✨ No Preference' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPreferences({ ...preferences, conversation: option.value })}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    preferences.conversation === option.value
                      ? 'bg-cyber-purple-500 text-white border-cyber-purple-500 shadow-neon'
                      : 'bg-cyber-dark-800 text-cyber-purple-400 border-cyber-purple-500/30 hover:border-cyber-purple-500/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pet Friendly */}
          <div className="card border-2 border-cyber-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-cyber-purple-500" />
                <div>
                  <h3 className="text-xl font-bold text-white">Pet Friendly</h3>
                  <p className="text-sm text-cyber-purple-400">Prefer vehicles that allow pets</p>
                </div>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, petFriendly: !preferences.petFriendly })}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  preferences.petFriendly ? 'bg-cyber-green-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                    preferences.petFriendly ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
