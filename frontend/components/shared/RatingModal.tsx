"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import toast from "react-hot-toast";
import { reviewApi } from "@/lib/api";

interface RatingModalProps {
  rideId: string;
  driverName: string;
  onClose: () => void;
}

export default function RatingModal({ rideId, driverName, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const quickTags = ["Great driver", "Clean car", "On time", "Safe driving", "Friendly"];

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.submit(rideId, rating, comment || undefined);
      toast.success("Rating submitted! Thank you.");
      onClose();
    } catch (err) {
      console.error("Failed to submit rating:", err);
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-cyber-dark-800 rounded-2xl shadow-neon-lg w-full max-w-md animate-slide-up border border-cyber-purple-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyber-purple-500/20">
          <h3 className="text-xl font-bold font-orbitron text-white">Rate Your Driver</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-cyber-purple-500/20">
            <X className="w-5 h-5 text-cyber-purple-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Driver */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyber-purple-500/20 to-cyber-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cyber-purple-500/30">
              <span className="text-2xl font-bold font-orbitron text-cyber-green-400">{driverName[0]}</span>
            </div>
            <p className="font-semibold text-white">{driverName}</p>
            <p className="text-sm text-cyber-purple-400">Ride #{rideId}</p>
          </div>

          {/* Stars */}
          <div>
            <p className="text-sm font-medium text-cyber-purple-400 text-center mb-3">How would you rate this ride?</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hovered || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-cyber-purple-500/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-cyber-purple-400 mt-2">
              {rating === 0 ? "Tap to rate" : ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </p>
          </div>

          {/* Quick Tags */}
          <div>
            <p className="text-sm font-medium text-cyber-purple-400 mb-2">Quick feedback:</p>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setComment((prev) => prev ? `${prev}, ${tag}` : tag)}
                  className="text-xs px-3 py-1.5 rounded-full border border-cyber-purple-500/30 hover:border-cyber-purple-500 hover:text-cyber-green-400 text-cyber-purple-400 transition-all duration-300 hover:shadow-neon"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-cyber-purple-400 mb-1">Additional comments (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Share your experience…"
            />
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Skip</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? (
              <span className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto block" />
            ) : (
              "Submit Rating"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
