"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, MessageSquare, TrendingUp, Loader2 } from "lucide-react";
import { reviewApi } from "@/lib/api";

interface Review {
  id: string;
  rider_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  pickup_address: string;
  dropoff_address: string;
}

export default function RatingsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    reviewApi.getMyDriverReviews()
      .then((res) => {
        const data = res.data.data;
        setReviews(data.reviews || []);
        setOverallRating(data.avgRating || 0);
        setTotalReviews(data.totalReviews || 0);
      })
      .catch((err) => {
        console.error("Failed to load reviews:", err);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Calculate rating breakdown
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  const ratingBreakdown = ratingCounts.map(({ stars, count }) => ({
    stars,
    count,
    percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
  }));

  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
  const positivePercentage = totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title">Ratings & Reviews</h2>
        <p className="section-subtitle">See what riders are saying about you.</p>
      </div>

      {/* Overall Rating */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card text-center group hover:shadow-neon-lg transition-all duration-300">
          <div className="w-16 h-16 bg-cyber-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Star className="w-8 h-8 text-cyber-green-400 fill-current" />
          </div>
          <p className="text-4xl font-bold font-orbitron text-cyber-green-400 drop-shadow-[0_0_10px_rgba(0,255,159,0.5)]">
            {overallRating.toFixed(1)}
          </p>
          <p className="text-sm text-cyber-purple-400 mt-1">Overall Rating</p>
          <p className="text-xs text-cyber-purple-500 mt-0.5">{totalReviews} reviews</p>
        </div>

        <div className="card group hover:shadow-neon-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyber-purple-500/20 rounded-xl flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-cyber-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-orbitron text-cyber-purple-400">{positivePercentage}%</p>
              <p className="text-xs text-cyber-purple-500">Positive Reviews</p>
            </div>
          </div>
        </div>

        <div className="card group hover:shadow-neon-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyber-pink-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyber-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-orbitron text-cyber-pink-400">{overallRating.toFixed(1)}</p>
              <p className="text-xs text-cyber-purple-500">Avg This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold font-orbitron text-white mb-4">Rating Breakdown</h3>
        <div className="space-y-3">
          {ratingBreakdown.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm text-cyber-purple-400 font-medium">{stars}</span>
                <Star className="w-4 h-4 text-cyber-green-400 fill-current" />
              </div>
              <div className="flex-1 h-2 bg-cyber-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyber-green-500 to-cyber-purple-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-cyber-purple-400 w-12 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-cyber-purple-400" />
          <h3 className="text-lg font-semibold font-orbitron text-white">Recent Reviews</h3>
          <span className="text-sm text-cyber-purple-400 ml-auto">{reviews.length} reviews</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-cyber-purple-500 mx-auto mb-3 animate-spin" />
            <p className="text-cyber-purple-400">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-cyber-purple-400 mx-auto mb-3 opacity-50" />
            <p className="text-white font-medium">No reviews yet</p>
            <p className="text-sm text-cyber-purple-400 mt-1">
              Complete rides to start receiving reviews from riders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-cyber-dark-800/50 border border-cyber-purple-500/30 rounded-xl p-4 hover:border-cyber-purple-500/60 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-white">{review.rider_name}</p>
                    <p className="text-xs text-cyber-purple-400">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "text-cyber-green-400 fill-current"
                            : "text-cyber-purple-500"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-cyber-purple-300 mb-2">{review.comment}</p>
                )}
                <p className="text-xs text-cyber-purple-500">
                  {review.pickup_address} → {review.dropoff_address}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
