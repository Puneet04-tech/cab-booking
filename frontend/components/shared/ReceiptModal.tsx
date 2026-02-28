"use client";

import { useEffect, useState } from "react";
import { X, MapPin, ArrowRight, Calendar, CreditCard, User, Car, Clock, Route, Download, Loader2, Mail } from "lucide-react";
import { paymentApi } from "@/lib/api";
import { MapComponent } from "@/components/MapComponent";

interface ReceiptData {
  id: string;
  pickup_address: string;
  stops?: string[];
  dropoff_address: string;
  ride_type: string;
  distance_km: number | null;
  duration_minutes: number | null;
  estimated_fare: number;
  final_fare: number | null;
  payment_method: string;
  promo_code: string | null;
  discount_amount: number | null;
  completed_at: string;
  rider_name: string;
  driver_name: string;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  subtotal: number;
  payment_status: string;
}

interface ReceiptModalProps {
  rideId: string;
  onClose: () => void;
}

export default function ReceiptModal({ rideId, onClose }: ReceiptModalProps) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    paymentApi.getReceipt(rideId)
      .then((res) => {
        setReceipt(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load receipt");
        setLoading(false);
      });
  }, [rideId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailSuccess(false);
    try {
      await paymentApi.resendReceipt(rideId);
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      setError("Failed to send receipt email");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-cyber-dark-800 rounded-2xl p-8 max-w-md w-full border-2 border-cyber-purple-500 shadow-neon-lg">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-cyber-purple-500 mx-auto mb-4 animate-spin" />
            <p className="text-cyber-purple-400">Loading receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-cyber-dark-800 rounded-2xl p-8 max-w-md w-full border-2 border-cyber-pink-500 shadow-neon-lg">
          <div className="text-center">
            <p className="text-cyber-pink-400 mb-4">{error || "Receipt not found"}</p>
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const receiptNumber = `RS-${rideId.slice(0, 8).toUpperCase()}`;
  const completedDate = new Date(receipt.completed_at);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-cyber-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-cyber-purple-500 shadow-neon-lg">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyber-purple-600 to-cyber-green-500 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white font-orbitron drop-shadow-lg">🚗 RideSwift</h2>
            <p className="text-white/90 text-sm">Ride Receipt</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Receipt Number */}
          <div className="text-center py-4 bg-cyber-purple-500/10 rounded-xl border border-cyber-purple-500/30">
            <p className="text-cyber-purple-400 text-xs uppercase tracking-wider mb-1">Receipt Number</p>
            <p className="text-cyber-green-400 text-2xl font-bold font-orbitron drop-shadow-[0_0_15px_rgba(0,255,159,0.6)]">
              {receiptNumber}
            </p>
          </div>

          {/* Trip Summary */}
          <div>
            <h3 className="text-lg font-bold text-cyber-green-400 mb-3 font-orbitron drop-shadow-[0_0_10px_rgba(0,255,159,0.5)]">
              Trip Summary
            </h3>
            
            {/* Mini route map */}
            <div className="mb-4">
              <MapComponent
                pickup={receipt.pickup_address}
                stops={receipt.stops || []}
                dropoff={receipt.dropoff_address}
              />
            </div>

            {/* Route addresses */}
            <div className="bg-cyber-purple-500/10 rounded-xl p-4 mb-4 border border-cyber-purple-500/30">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-cyber-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-cyber-purple-400 text-xs uppercase mb-1">Pickup</p>
                    <p className="text-cyber-green-300">{receipt.pickup_address}</p>
                  </div>
                </div>
                {receipt.stops && receipt.stops.length > 0 && (
                  receipt.stops.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 pl-8">
                      <div className="h-8 w-0.5 bg-cyber-purple-500/30"></div>
                      <div>
                        <p className="text-cyber-purple-400 text-xs uppercase mb-1">Stop {i + 1}</p>
                        <p className="text-cyber-green-300">{s}</p>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex items-start gap-3 pl-8">
                  <div className="h-8 w-0.5 bg-cyber-purple-500/30"></div>
                  <MapPin className="w-5 h-5 text-cyber-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-cyber-purple-400 text-xs uppercase mb-1">Dropoff</p>
                    <p className="text-cyber-green-300">{receipt.dropoff_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-cyber-purple-500/10 rounded-xl p-3 border border-cyber-purple-500/30">
                <div className="flex items-center gap-2 text-cyber-purple-400 text-xs mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Driver</span>
                </div>
                <p className="text-cyber-green-300 font-semibold">{receipt.driver_name}</p>
              </div>
              
              <div className="bg-cyber-purple-500/10 rounded-xl p-3 border border-cyber-purple-500/30">
                <div className="flex items-center gap-2 text-cyber-purple-400 text-xs mb-1">
                  <Car className="w-3.5 h-3.5" />
                  <span>Vehicle Type</span>
                </div>
                <p className="text-cyber-green-300 font-semibold capitalize">{receipt.ride_type}</p>
              </div>
              
              <div className="bg-cyber-purple-500/10 rounded-xl p-3 border border-cyber-purple-500/30">
                <div className="flex items-center gap-2 text-cyber-purple-400 text-xs mb-1">
                  <Route className="w-3.5 h-3.5" />
                  <span>Distance</span>
                </div>
                <p className="text-cyber-green-300 font-semibold">{Number(receipt.distance_km ?? 0).toFixed(2)} km</p>
              </div>
              
              <div className="bg-cyber-purple-500/10 rounded-xl p-3 border border-cyber-purple-500/30">
                <div className="flex items-center gap-2 text-cyber-purple-400 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Duration</span>
                </div>
                <p className="text-cyber-green-300 font-semibold">{receipt.duration_minutes ?? 0} min</p>
              </div>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div>
            <h3 className="text-lg font-bold text-cyber-green-400 mb-3 font-orbitron drop-shadow-[0_0_10px_rgba(0,255,159,0.5)]">
              Fare Breakdown
            </h3>
            <div className="bg-cyber-purple-500/10 rounded-xl p-4 border border-cyber-purple-500/30 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-cyber-purple-400">Base Fare</span>
                <span className="text-cyber-green-300 font-semibold">${Number(receipt.baseFare).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-purple-400">Distance ({Number(receipt.distance_km ?? 0).toFixed(2)} km)</span>
                <span className="text-cyber-green-300 font-semibold">${Number(receipt.distanceFare).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-purple-400">Time ({receipt.duration_minutes ?? 0} min)</span>
                <span className="text-cyber-green-300 font-semibold">${Number(receipt.timeFare).toFixed(2)}</span>
              </div>
              
              {receipt.discount_amount && receipt.discount_amount > 0 && (
                <>
                  <div className="border-t border-cyber-purple-500/30 pt-2.5"></div>
                  <div className="flex justify-between">
                    <span className="text-cyber-green-400">
                      Discount {receipt.promo_code && `(${receipt.promo_code})`}
                    </span>
                    <span className="text-cyber-green-400 font-semibold">-${Number(receipt.discount_amount ?? 0).toFixed(2)}</span>
                  </div>
                </>
              )}
              
              <div className="border-t-2 border-cyber-purple-500/50 pt-3 mt-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-cyber-green-400 font-bold text-lg font-orbitron drop-shadow-[0_0_10px_rgba(0,255,159,0.5)]">
                  Total Paid
                </span>
                <span className="text-cyber-green-400 font-bold text-xl font-orbitron drop-shadow-[0_0_15px_rgba(0,255,159,0.6)]">
                  ${Number(receipt.final_fare ?? receipt.estimated_fare ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-cyber-green-500/5 rounded-xl p-4 border border-cyber-green-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyber-purple-400">
                <CreditCard className="w-4 h-4" />
                <span>Payment Method</span>
              </div>
              <span className="text-cyber-green-300 font-semibold capitalize">{receipt.payment_method}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyber-purple-400">
                <Calendar className="w-4 h-4" />
                <span>Date & Time</span>
              </div>
              <span className="text-cyber-green-300 font-semibold">
                {completedDate.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          </div>

          {/* Thank You */}
          <div className="text-center py-4 border-t border-cyber-purple-500/30">
            <p className="text-cyber-green-400 font-semibold mb-1">Thank you for riding with RideSwift!</p>
            <p className="text-cyber-purple-400 text-sm">We hope to serve you again soon.</p>
          </div>

          {/* Success Message */}
          {emailSuccess && (
            <div className="bg-cyber-green-500/20 border border-cyber-green-500/50 rounded-xl p-3 text-center">
              <p className="text-cyber-green-400 font-semibold">✅ Receipt sent to your email!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleSendEmail} 
              disabled={sendingEmail}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send to Email
                </>
              )}
            </button>
            <button onClick={handlePrint} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button onClick={onClose} className="btn-primary flex-1">
              Close
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-cyber-purple-500 text-xs pt-4 border-t border-cyber-purple-500/20">
            <p>© {new Date().getFullYear()} RideSwift. All rights reserved.</p>
            <p className="mt-1">Questions? Contact us at support@rideswift.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
