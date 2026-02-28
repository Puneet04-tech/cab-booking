// New Features API - Carbon Footprint, Favorites, Preferences, Memories, Achievements

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

function getAuthHeaders(): HeadersInit {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

// ========== CARBON FOOTPRINT ==========
export const carbonApi = {
  async getStats() {
    const res = await fetch(`${BACKEND}/api/carbon/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch carbon stats");
    return res.json();
  },
};

// ========== FAVORITE ROUTES ==========
export const favoritesApi = {
  async getAll() {
    const res = await fetch(`${BACKEND}/api/favorites`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch favorite routes");
    return res.json();
  },

  async add(route: {
    routeName: string;
    pickup: { address: string; lat: number; lng: number };
    dropoff: { address: string; lat: number; lng: number };
    preferredRideType?: string;
  }) {
    const res = await fetch(`${BACKEND}/api/favorites`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(route),
    });
    if (!res.ok) throw new Error("Failed to add favorite route");
    return res.json();
  },

  async delete(id: string) {
    const res = await fetch(`${BACKEND}/api/favorites/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete favorite route");
    return res.json();
  },

  async incrementUsage(id: string) {
    const res = await fetch(`${BACKEND}/api/favorites/${id}/use`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to update usage");
    return res.json();
  },
};

// ========== RIDE PREFERENCES ==========
export const preferencesApi = {
  async get() {
    const res = await fetch(`${BACKEND}/api/preferences`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch preferences");
    return res.json();
  },

  async update(preferences: {
    musicPreference?: string;
    temperature?: string;
    conversation?: string;
    petFriendly?: boolean;
    accessibilityNeeds?: string[];
  }) {
    const res = await fetch(`${BACKEND}/api/preferences`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences),
    });
    if (!res.ok) throw new Error("Failed to update preferences");
    return res.json();
  },
};

// ========== RIDE MEMORIES ==========
export const memoriesApi = {
  async getAll(onlyFavorites = false) {
    const res = await fetch(
      `${BACKEND}/api/memories?onlyFavorites=${onlyFavorites}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!res.ok) throw new Error("Failed to fetch memories");
    return res.json();
  },

  async save(memory: {
    rideId: string;
    title?: string;
    notes?: string;
    photos?: string[];
    isFavorite?: boolean;
  }) {
    const res = await fetch(`${BACKEND}/api/memories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(memory),
    });
    if (!res.ok) throw new Error("Failed to save memory");
    return res.json();
  },

  async delete(rideId: string) {
    const res = await fetch(`${BACKEND}/api/memories/${rideId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete memory");
    return res.json();
  },
};

// ========== ACHIEVEMENTS ==========
export const achievementsApi = {
  async getAll() {
    const res = await fetch(`${BACKEND}/api/achievements`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch achievements");
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${BACKEND}/api/achievements/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch achievement stats");
    return res.json();
  },
};
