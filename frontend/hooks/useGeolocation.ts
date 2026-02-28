import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    setState((prev) => ({
      ...prev,
      error: error.message,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolocation is not supported", loading: false }));
      return;
    }

    const geo = navigator.geolocation;
    const geoOptions = { enableHighAccuracy, timeout, maximumAge };

    if (watch) {
      const watchId = geo.watchPosition(onSuccess, onError, geoOptions);
      return () => geo.clearWatch(watchId);
    } else {
      geo.getCurrentPosition(onSuccess, onError, geoOptions);
    }
  }, [enableHighAccuracy, maximumAge, onError, onSuccess, timeout, watch]);

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }));
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, maximumAge, onError, onSuccess, timeout]);

  return { ...state, refetch };
}
