import axios, { AxiosError, AxiosRequestConfig } from "axios";

const BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")) ?? "http://localhost:5000";

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT cookie token to every request
apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    try {
      // Read JWT from cookie
      const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
      const token = match ? decodeURIComponent(match[1]) : null;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore
    }
  }
  return config;
});

// Global error handling
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const message =
      (error.response?.data as { error?: string })?.error ??
      error.message ??
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// ─── Ride APIs ────────────────────────────────────────────────────────────────
export const rideApi = {
  estimate: (pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }) =>
    apiClient.post("/rides/estimate", { pickup, dropoff }),

  book: (payload: {
    pickup: { address: string; lat: number; lng: number };
    dropoff: { address: string; lat: number; lng: number };
    stops?: { address: string; lat: number; lng: number }[];
    rideType: string;
    paymentMethod: string;
    promoCode?: string;
  }) => apiClient.post("/rides", payload),

  getActive: () => apiClient.get("/rides/active"),

  cancel: (rideId: string, reason?: string) =>
    apiClient.patch(`/rides/${rideId}/cancel`, { reason }),

  getHistory: (page = 1, limit = 20) =>
    apiClient.get(`/rides/history?page=${page}&limit=${limit}`),

  getById: (rideId: string) => apiClient.get(`/rides/${rideId}`),

  getRiderStats: () => apiClient.get("/rides/stats/rider"),

  getAvailable: () => apiClient.get("/rides/available"),

  getDriverStats: () => apiClient.get("/rides/stats/driver"),

  getDriverActive: () => apiClient.get("/rides/driver/active"),
  
  simulateProgress: (rideId: string) => apiClient.post(`/rides/${rideId}/simulate`),
};


// ─── Driver APIs ──────────────────────────────────────────────────────────────
export const driverApi = {
  toggleStatus: (status: "online" | "offline" | "busy") =>
    apiClient.patch("/drivers/status", { status }),

  updateLocation: (lat: number, lng: number) =>
    apiClient.patch("/drivers/location", { lat, lng }),

  acceptRide: (rideId: string) => apiClient.patch(`/rides/${rideId}/accept`),

  declineRide: (rideId: string) => apiClient.patch(`/rides/${rideId}/decline`),

  startRide: (rideId: string) => apiClient.patch(`/rides/${rideId}/start`),

  completeRide: (rideId: string) => apiClient.patch(`/rides/${rideId}/complete`),

  getEarnings: (period: "week" | "month" | "year") =>
    apiClient.get(`/drivers/earnings?period=${period}`),
  getRegistered: () => apiClient.get(`/drivers/registered`),
  setLocation: (id: number, lat: number, lng: number) =>
    apiClient.patch(`/drivers/${id}/location`, { lat, lng }),
};

// ─── User APIs ────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => apiClient.get("/users/profile"),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; bio?: string }) =>
    apiClient.put("/users/profile", data),

  addEmergencyContact: (contact: { name: string; phone: string }) =>
    apiClient.post("/users/emergency-contacts", contact),

  getNotifications: () => apiClient.get("/users/notifications"),

  markNotificationRead: (notificationId: string) =>
    apiClient.patch(`/users/notifications/${notificationId}/read`),
};

// ─── Payment APIs ─────────────────────────────────────────────────────────────
export const paymentApi = {
  createPaymentIntent: (rideId: string) =>
    apiClient.post("/payments/create-intent", { rideId }),

  getSavedCards: () => apiClient.get("/payments/cards"),

  addCard: (cardData: { number: string; expiry: string; cvv: string; name: string }) =>
    apiClient.post("/payments/cards", cardData),

  removeCard: (cardId: string) => apiClient.delete(`/payments/cards/${cardId}`),

  getTransactions: () => apiClient.get("/payments/transactions"),

  getReceipt: (rideId: string) =>
    apiClient.get(`/payments/receipt/${rideId}`),

  resendReceipt: (rideId: string) =>
    apiClient.post(`/payments/receipt/${rideId}/resend`),

  getWalletBalance: () => apiClient.get("/payments/wallet/balance"),

  topUpWallet: (amount: number) => apiClient.post("/payments/wallet/topup", { amount }),

  deductFromWallet: (rideId: string, amount: number) =>
    apiClient.post("/payments/wallet/deduct", { rideId, amount }),

  processRidePayment: (rideId: string) =>
    apiClient.post("/payments/process-ride", { rideId }),
};

// ─── Review APIs ──────────────────────────────────────────────────────────────
export const reviewApi = {
  submit: (rideId: string, rating: number, comment?: string) =>
    apiClient.post("/reviews", { rideId, rating, comment }),

  getMyDriverReviews: () =>
    apiClient.get("/reviews/driver/me"),

  getMyReviewedRides: () =>
    apiClient.get("/reviews/rider/me/reviewed"),

  getDriverReviews: (driverId: string) =>
    apiClient.get(`/reviews/driver/${driverId}`),
};

// ─── Promo Code APIs ──────────────────────────────────────────────────────────
export const promoApi = {
  validate: (code: string) => apiClient.post("/promos/validate", { code }),
};

// ─── SOS APIs ─────────────────────────────────────────────────────────────────
export const sosApi = {
  trigger: (rideId: string, location: { lat: number; lng: number }) =>
    apiClient.post("/sos/trigger", { rideId, location }),
};

export default apiClient;
