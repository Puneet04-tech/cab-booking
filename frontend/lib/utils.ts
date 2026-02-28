import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calculate fare based on distance (meters) and duration (seconds).
 */
export function calculateFare(
  distanceMeters: number,
  durationSeconds: number,
  rideType: "economy" | "premium" | "suv" | "auto" = "economy",
  surgeFactor = 1.0
) {
  const rates = {
    economy: { base: 2.5,  perKm: 0.9,  perMin: 0.12 },
    premium: { base: 5.0,  perKm: 1.8,  perMin: 0.25 },
    suv:     { base: 6.0,  perKm: 2.2,  perMin: 0.30 },
    auto:    { base: 1.5,  perKm: 0.6,  perMin: 0.08 },
  };

  const rate = rates[rideType];
  const km = distanceMeters / 1000;
  const min = durationSeconds / 60;

  const fare = (rate.base + km * rate.perKm + min * rate.perMin) * surgeFactor;
  return Math.max(fare, rate.base);
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRideStatusColor(status: string) {
  const map: Record<string, string> = {
    pending:          "badge-warning",
    accepted:         "badge-info",
    driver_arriving:  "badge-info",
    in_progress:      "badge-primary",
    completed:        "badge-success",
    cancelled:        "badge-danger",
  };
  return map[status] ?? "badge-info";
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Haversine formula: calculate straight-line distance between two GPS coords
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
