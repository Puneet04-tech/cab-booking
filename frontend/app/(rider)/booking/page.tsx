"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { Navigation, X, Plus, ChevronDown, Tag, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
const MapComponent = dynamic(() => import("@/components/MapComponent").then((mod) => mod.MapComponent), { ssr: false });
import { rideApi, paymentApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import PaymentModal from "@/components/shared/PaymentModal";

// Base rates per km for each ride type
const RIDE_RATES = {
  economy: { base: 3, perKm: 1.2, name: "Economy", desc: "Affordable everyday rides", icon: "🚗", capacity: 4 },
  premium: { base: 5, perKm: 2.0, name: "Premium", desc: "Comfortable premium sedan", icon: "🚙", capacity: 4 },
  suv: { base: 8, perKm: 2.5, name: "SUV", desc: "Spacious ride for groups", icon: "🚐", capacity: 6 },
  auto: { base: 2, perKm: 0.8, name: "Auto", desc: "Budget-friendly, open ride", icon: "🛺", capacity: 3 },
} as const;

type Step = "location" | "ride-select" | "confirm";

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("location");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [selectedRide, setSelectedRide] = useState<string>("economy");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isLoading, setIsLoading] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pendingRideData, setPendingRideData] = useState<any>(null);

  // Fetch wallet balance on component mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balanceRes = await paymentApi.getWalletBalance();
        setWalletBalance(balanceRes.data?.data?.balance ?? 0);
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
      }
    };
    fetchBalance();
  }, []);

  const addStop = () => {
    if (stops.length < 3) setStops([...stops, ""]);
  };

  const removeStop = (i: number) => setStops(stops.filter((_, idx) => idx !== i));

  const updateStop = (i: number, val: string) =>
    setStops(stops.map((s, idx) => (idx === i ? val : s)));

  const applyPromo = useCallback(() => {
    if (promoCode.toLowerCase() === "ride10") {
      setPromoApplied(true);
      toast.success("Promo code applied! 10% discount");
    } else {
      toast.error("Invalid promo code");
    }
  }, [promoCode]);

  const calculateFare = useCallback((rideType: string, distance: number): number => {
    const rate = RIDE_RATES[rideType as keyof typeof RIDE_RATES];
    if (!rate || distance <= 0) return 0;
    const fare = rate.base + rate.perKm * distance;
    return promoApplied ? fare * 0.9 : fare;
  }, [promoApplied]);

  const handleDistanceCalculated = useCallback((km: number, minutes: number) => {
    setDistanceKm(km);
    setDurationMinutes(minutes);
  }, []);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'RideSwift/1.0',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      // Fallback coordinates (New York City)
      return { lat: 40.7128, lng: -74.006 };
    } catch (error) {
      console.error('Geocoding error:', error);
      return { lat: 40.7128, lng: -74.006 };
    }
  };

  const handleNext = async () => {
    if (step === "location") {
      if (!pickup || !dropoff) {
        toast.error("Please enter pickup and drop-off locations");
        return;
      }
      // Geocode while transitioning steps
      const [pCoords, dCoords] = await Promise.all([
        geocodeAddress(pickup),
        geocodeAddress(dropoff),
      ]);
      setPickupCoords(pCoords);
      setDropoffCoords(dCoords);
      setStep("ride-select");
    } else if (step === "ride-select") {
      setStep("confirm");
    }
  };

  const handleBookRide = async () => {
    setIsLoading(true);
    try {
      const pCoords = pickupCoords ?? { lat: 40.7128, lng: -74.006 };
      const dCoords = dropoffCoords ?? { lat: 40.7306, lng: -73.9352 };

      const rideData = {
        pickup: { address: pickup, lat: pCoords.lat, lng: pCoords.lng },
        dropoff: { address: dropoff, lat: dCoords.lat, lng: dCoords.lng },
        stops: stops
          .filter(Boolean)
          .map((s) => ({ address: s, lat: pCoords.lat, lng: pCoords.lng })),
        rideType: selectedRide,
        paymentMethod,
        promoCode: promoApplied ? promoCode : undefined,
      };

      // If payment method is wallet or card, check balance and show payment modal
      if (paymentMethod === "wallet" || paymentMethod === "card") {
        // Fetch wallet balance
        const balanceRes = await paymentApi.getWalletBalance();
        const balance = balanceRes.data?.data?.balance ?? 0;
        setWalletBalance(balance);
        
        // Check if wallet has sufficient balance
        if (balance < selectedFare) {
          toast.error(`Insufficient wallet balance! You need $${selectedFare.toFixed(2)} but have $${balance.toFixed(2)}. Please top up your wallet.`);
          setIsLoading(false);
          return;
        }
        
        setPendingRideData(rideData);
        setShowPaymentModal(true);
        setIsLoading(false);
      } else {
        // Cash payment - book directly
        const bookingResponse = await rideApi.book(rideData);
        const rideId = bookingResponse.data?.data?.id || bookingResponse.data?.id;
        
        toast.success("Ride booked! Searching for nearby drivers…");
        
        // Auto-simulate ride progress for demo
        if (rideId) {
          rideApi.simulateProgress(rideId).catch(err => {
            console.error("Failed to start ride simulation:", err);
          });
        }
        
        router.push("/dashboard");
        setIsLoading(false);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to book ride. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      if (!pendingRideData) return;
      
      // First, book the ride to get the ride ID
      const bookingResponse = await rideApi.book(pendingRideData);
      const rideId = bookingResponse.data?.data?.id || bookingResponse.data?.id;
      
      // If wallet or card payment, deduct from wallet
      if (pendingRideData.paymentMethod === "wallet" || pendingRideData.paymentMethod === "card") {
        try {
          // Deduct the payment from wallet
          await paymentApi.deductFromWallet(rideId, selectedFare);
          toast.success("Payment processed! Ride booked successfully. Searching for nearby drivers…");
        } catch (paymentErr: any) {
          // If payment fails, we should ideally cancel the ride, but for now just notify
          console.error("Payment deduction failed:", paymentErr);
          toast.error("Ride booked but payment processing failed. Please check your wallet.");
        }
      } else {
        toast.success("Ride booked! Searching for nearby drivers…");
      }
      
      // Auto-simulate ride progress for demo (searching → accepted → in_progress → completed)
      if (rideId) {
        rideApi.simulateProgress(rideId).catch(err => {
          console.error("Failed to start ride simulation:", err);
        });
      }
      
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to book ride. Please try again.");
    }
  };

  const selected = RIDE_RATES[selectedRide as keyof typeof RIDE_RATES];
  const selectedFare = calculateFare(selectedRide, distanceKm);

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h2 className="section-title">Book a Ride</h2>
        <p className="section-subtitle">Enter your journey details below.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {(["location", "ride-select", "confirm"] as Step[]).map((s, i) => {
          const active = s === step;
          const done = ["location", "ride-select", "confirm"].indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                  ${done ? "bg-cyber-green-500 text-cyber-dark-900 border-cyber-green-500 shadow-neon-green" : active ? "bg-cyber-purple-500 text-cyber-green-500 border-cyber-purple-500 shadow-neon" : "bg-cyber-dark-800 text-cyber-purple-400 border-cyber-purple-500/30"}`}
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium capitalize ${active ? "text-cyber-green-500" : "text-cyber-purple-400"}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {s.replace("-", " ")}
              </span>
              {i < 2 && <div className={`flex-1 h-0.5 ${done ? "bg-cyber-green-500 shadow-neon-green" : "bg-cyber-purple-500/30"}`} />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Location */}
      {step === "location" && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-cyber-purple-600" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(123, 63, 242, 0.7)' }}>Where are you going?</h3>

          {/* Pickup */}
          <div className="relative">
            <div className="absolute left-3 top-3.5 w-3 h-3 bg-cyber-green-500 rounded-full animate-pulse shadow-neon-green" />
            <input
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Enter pickup location"
              className="input-field pl-8"
            />
          </div>

          {/* Stops */}
          {stops.map((stop, i) => (
            <div key={i} className="relative">
              <div className="absolute left-3 top-3.5 w-3 h-3 bg-cyber-purple-500 rounded-full" />
              <input
                value={stop}
                onChange={(e) => updateStop(i, e.target.value)}
                placeholder={`Stop ${i + 1}`}
                className="input-field pl-8 pr-10"
              />
              <button
                onClick={() => removeStop(i)}
                className="absolute right-3 top-3 text-cyber-purple-400 hover:text-cyber-pink-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          {/* Dropoff */}
          <div className="relative">
            <div className="absolute left-3 top-3.5 w-3 h-3 bg-cyber-pink-500 rounded-full animate-pulse" />
            <input
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="Enter drop-off location"
              className="input-field pl-8"
            />
          </div>

          {stops.length < 3 && (
            <button
              onClick={addStop}
              className="flex items-center gap-2 text-sm text-cyber-green-500 hover:text-cyber-green-400 font-medium transition-colors"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              <Plus className="w-4 h-4" /> Add a Stop
            </button>
          )}

          {/* Google Map */}
          <MapComponent pickup={pickup} stops={stops} dropoff={dropoff} onDistanceCalculated={handleDistanceCalculated} />

          {distanceKm > 0 && (
            <div className="bg-cyber-purple-500/20 border-2 border-cyber-purple-500 rounded-lg p-3 flex items-center justify-between text-sm shadow-neon">
              <span className="text-cyber-green-500 font-medium" style={{ fontFamily: 'Orbitron, sans-serif' }}>Distance: {distanceKm.toFixed(1)} km</span>
              <span className="text-cyber-purple-400">~{durationMinutes} min</span>
            </div>
          )}

          <button onClick={handleNext} className="btn-primary w-full">
            Continue <ChevronDown className="inline w-4 h-4 rotate-[-90deg]" />
          </button>
        </div>
      )}

      {/* Step 2: Ride Selection */}
      {step === "ride-select" && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-cyber-purple-600" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(123, 63, 242, 0.7)' }}>Choose Your Ride</h3>
            <p className="text-sm text-cyber-green-500/70">
              <span className="font-medium text-cyber-green-500">{pickup}</span> → <span className="font-medium text-cyber-green-500">{dropoff}</span>
              {distanceKm > 0 && <span className="ml-2 text-cyber-purple-400">· {distanceKm.toFixed(1)} km</span>}
            </p>

            <div className="space-y-3">
              {Object.entries(RIDE_RATES).map(([type, info]) => {
                const fare = calculateFare(type, distanceKm);
                const etaMin = Math.ceil(durationMinutes * 0.1) + (type === "economy" ? 3 : type === "premium" ? 5 : type === "suv" ? 7 : 2);
                return (
                  <label
                    key={type}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-300
                      ${selectedRide === type ? "border-cyber-purple-500 bg-cyber-purple-500/20 shadow-neon" : "border-cyber-purple-500/30 hover:border-cyber-purple-500/50 hover:bg-cyber-purple-500/10"}`}
                  >
                    <input
                      type="radio"
                      name="ride"
                      value={type}
                      checked={selectedRide === type}
                      onChange={() => setSelectedRide(type)}
                      className="hidden"
                    />
                    <span className="text-3xl">{info.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>{info.name}</span>
                        <span className="text-xs text-cyber-purple-400">· {info.capacity} seats</span>
                      </div>
                      <p className="text-sm text-cyber-green-500/70">{info.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {fare > 0 ? `$${fare.toFixed(2)}` : "—"}
                      </p>
                      <p className="text-xs text-cyber-purple-400">{etaMin} min away</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Promo Code */}
          <div className="card">
            <h4 className="font-semibold text-cyber-purple-600 mb-3 flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <Tag className="w-4 h-4 text-cyber-green-500" /> Promo Code
            </h4>
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter code (try: RIDE10)"
                className="input-field flex-1"
                disabled={promoApplied}
              />
              <button
                onClick={applyPromo}
                disabled={!promoCode || promoApplied}
                className="btn-primary !py-3 !px-5"
              >
                {promoApplied ? "✓" : "Apply"}
              </button>
            </div>
            {promoApplied && <p className="text-sm text-cyber-green-500 mt-2" style={{ textShadow: '0 0 5px rgba(0, 255, 159, 0.5)' }}>✓ 10% discount applied!</p>}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("location")} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={handleNext} className="btn-primary flex-1">
              Confirm Ride Type
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-semibold text-cyber-purple-600" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(123, 63, 242, 0.7)' }}>Confirm Your Ride</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-cyber-purple-500/30">
                <span className="text-cyber-purple-400">Pickup</span>
                <span className="font-medium text-cyber-green-500">{pickup}</span>
              </div>
              {stops.map((s, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-cyber-purple-500/30">
                  <span className="text-cyber-purple-400">Stop {i + 1}</span>
                  <span className="font-medium text-cyber-green-500">{s}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-b border-cyber-purple-500/30">
                <span className="text-cyber-purple-400">Drop-off</span>
                <span className="font-medium text-cyber-green-500">{dropoff}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cyber-purple-500/30">
                <span className="text-cyber-purple-400">Ride Type</span>
                <span className="font-medium text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>{selected.icon} {selected.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cyber-purple-500/30">
                <span className="text-cyber-purple-400">Distance</span>
                <span className="font-medium text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>{distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-cyber-purple-500/30">
                <span className="text-cyber-purple-400">Estimated Fare</span>
                <span className="font-semibold text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>${selectedFare > 0 ? selectedFare.toFixed(2) : '—'}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between py-2 border-b border-cyber-purple-500/30">
                  <span className="text-cyber-green-500">Promo Discount (10%)</span>
                  <span className="text-cyber-green-500 font-medium" style={{ textShadow: '0 0 5px rgba(0, 255, 159, 0.5)' }}>-${(selectedFare * 0.1).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <h4 className="font-semibold text-cyber-purple-600 mb-3 flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <CreditCard className="w-4 h-4 text-cyber-green-500" /> Payment Method
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "card",   label: "Card",   icon: "💳" },
                { id: "wallet", label: "Wallet", icon: "👛" },
                { id: "cash",   label: "Cash",   icon: "💵" },
              ].map(({ id, label, icon }) => (
                <label
                  key={id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-300
                    ${paymentMethod === id ? "border-cyber-purple-500 bg-cyber-purple-500/20 shadow-neon" : "border-cyber-purple-500/30 hover:border-cyber-purple-500/50"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={id}
                    checked={paymentMethod === id}
                    onChange={() => setPaymentMethod(id)}
                    className="hidden"
                  />
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-medium text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</span>
                </label>
              ))}
            </div>
            
            {/* Wallet Balance Info */}
            {(paymentMethod === "wallet" || paymentMethod === "card") && (
              <div className={`mt-3 p-3 rounded-lg border-2 ${
                walletBalance >= selectedFare 
                  ? "bg-cyber-green-500/10 border-cyber-green-500/30" 
                  : "bg-cyber-pink-500/10 border-cyber-pink-500/30"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-cyber-purple-400">Wallet Balance</span>
                  <span className={`font-bold font-orbitron ${
                    walletBalance >= selectedFare ? "text-cyber-green-500" : "text-cyber-pink-500"
                  }`}>
                    ${walletBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cyber-purple-400">Required</span>
                  <span className="font-bold font-orbitron text-cyber-green-500">
                    ${selectedFare.toFixed(2)}
                  </span>
                </div>
                {walletBalance < selectedFare && (
                  <p className="text-xs text-cyber-pink-500 mt-2 font-medium">
                    ⚠️ Insufficient balance! Please top up ${(selectedFare - walletBalance).toFixed(2)} to continue.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SOS Notice */}
          <div className="bg-cyber-pink-500/20 border-2 border-cyber-pink-500 rounded-lg p-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyber-pink-500 flex-shrink-0" />
            <p className="text-sm text-cyber-pink-500">
              SOS button will be available during your ride for emergencies.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("ride-select")} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={handleBookRide} disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner w-4 h-4 border-2 border-cyber-green-500 border-t-transparent rounded-full animate-spin" />
                  Booking…
                </span>
              ) : (
                "Confirm & Book Ride"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPendingRideData(null);
          }}
          amount={selectedFare}
          rideId="pending"
          onPaymentSuccess={handlePaymentSuccess}
          walletBalance={walletBalance}
        />
      )}
    </div>
  );
}
