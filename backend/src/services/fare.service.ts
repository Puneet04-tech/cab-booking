import axios from "axios";

interface Coords { lat: number; lng: number; }

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFactor: number;
}

export interface FareEstimate {
  rideType: string;
  estimatedFare: number;
  distance: number;       // meters
  duration: number;       // seconds
  breakdown: FareBreakdown;
}

const RATES = {
  economy: { base: 2.5,  perKm: 0.9,  perMin: 0.12 },
  premium: { base: 5.0,  perKm: 1.8,  perMin: 0.25 },
  suv:     { base: 6.0,  perKm: 2.2,  perMin: 0.30 },
  auto:    { base: 1.5,  perKm: 0.6,  perMin: 0.08 },
};

/**
 * Calculates fare estimate for a single ride type.
 * Uses Google Distance Matrix API if API key is set, otherwise uses haversine.
 */
export async function estimateFare(
  origin: Coords,
  destination: Coords,
  rideType: keyof typeof RATES = "economy"
): Promise<FareEstimate> {
  let distanceMeters: number;
  let durationSeconds: number;

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      const resp = await axios.get(
        "https://maps.googleapis.com/maps/api/distancematrix/json",
        {
          params: {
            origins: `${origin.lat},${origin.lng}`,
            destinations: `${destination.lat},${destination.lng}`,
            key: apiKey,
          },
          timeout: 5000,
        }
      );
      const element = resp.data?.rows?.[0]?.elements?.[0];
      if (element?.status === "OK") {
        distanceMeters = element.distance.value;
        durationSeconds = element.duration.value;
      } else {
        throw new Error("Google Maps API returned no results");
      }
    } else {
      throw new Error("No Google Maps API key");
    }
  } catch {
    // Fallback: haversine distance (as crow flies)
    distanceMeters = haversine(origin, destination);
    durationSeconds = (distanceMeters / 1000) * 60 * 2; // ~2 min/km estimate
  }

  const rate = RATES[rideType];
  const km = distanceMeters / 1000;
  const min = durationSeconds / 60;

  // Surge factor (simplified – real apps use demand data)
  const hour = new Date().getHours();
  const surgeFactor = hour >= 7 && hour <= 9 || hour >= 17 && hour <= 20 ? 1.3 : 1.0;

  const baseFare = rate.base;
  const distanceFare = km * rate.perKm;
  const timeFare = min * rate.perMin;
  const estimatedFare = Math.max((baseFare + distanceFare + timeFare) * surgeFactor, rate.base);

  return {
    rideType,
    estimatedFare: parseFloat(estimatedFare.toFixed(2)),
    distance: distanceMeters,
    duration: durationSeconds,
    breakdown: {
      baseFare,
      distanceFare: parseFloat(distanceFare.toFixed(2)),
      timeFare: parseFloat(timeFare.toFixed(2)),
      surgeFactor,
    },
  };
}

/**
 * Returns fare estimates for all ride types at once.
 */
export async function estimateAllFares(
  origin: Coords,
  destination: Coords
): Promise<FareEstimate[]> {
  const types = Object.keys(RATES) as (keyof typeof RATES)[];
  return Promise.all(types.map((t) => estimateFare(origin, destination, t)));
}

function haversine(a: Coords, b: Coords): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
