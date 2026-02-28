// ─── User Types ──────────────────────────────────────────────────────────────
export type UserRole = "rider" | "driver" | "admin";

export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePicture?: string;
  rating: number;
  createdAt: string;
}

// ─── Location Types ───────────────────────────────────────────────────────────
export interface Location {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

// ─── Ride Types ───────────────────────────────────────────────────────────────
export type RideStatus =
  | "pending"
  | "accepted"
  | "driver_arriving"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RideType = "economy" | "premium" | "suv" | "auto";

export interface RideOption {
  type: RideType;
  label: string;
  description: string;
  baseFare: number;
  perKm: number;
  perMin: number;
  capacity: number;
  icon: string;
  estimatedTime: number;
}

export interface Stop {
  address: string;
  lat: number;
  lng: number;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: Location;
  dropoff: Location;
  stops?: Stop[];
  status: RideStatus;
  rideType: RideType;
  estimatedFare: number;
  finalFare?: number;
  distance?: number;
  duration?: number;
  promoCode?: string;
  discountAmount?: number;
  paymentStatus?: "pending" | "paid" | "refunded";
  paymentMethod?: string;
  createdAt: string;
  completedAt?: string;
  rider?: User;
  driver?: Driver;
}

// ─── Driver Types ─────────────────────────────────────────────────────────────
export type DriverStatus = "offline" | "online" | "busy";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: RideType;
}

export interface Driver extends User {
  status: DriverStatus;
  vehicle?: Vehicle;
  currentLocation?: { lat: number; lng: number };
  totalRides: number;
  totalEarnings: number;
  isVerified: boolean;
}

// ─── Payment Types ────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  rideId: string;
  riderId: string;
  driverId: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  stripePaymentIntentId: string;
  paymentMethod: string;
  createdAt: string;
}

// ─── Review Types ─────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  rideId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  type: "ride_request" | "ride_accepted" | "driver_arriving" | "ride_completed" | "payment_received";
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ─── Promo Code Types ─────────────────────────────────────────────────────────
export interface PromoCode {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minFare?: number;
  maxDiscount?: number;
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Fare Estimate Types ──────────────────────────────────────────────────────
export interface FareEstimate {
  rideType: RideType;
  estimatedFare: number;
  distance: number;
  duration: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFactor: number;
  };
}

// ─── SOS Types ────────────────────────────────────────────────────────────────
export interface SOSAlert {
  id: string;
  userId: string;
  rideId?: string;
  location: { lat: number; lng: number };
  emergencyContacts: string[];
  createdAt: string;
}
