"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon issue in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapComponentProps {
  pickup?: string;
  stops?: string[];
  dropoff?: string;
  onDistanceCalculated?: (distanceKm: number, durationMinutes: number) => void;
}

interface Coordinates {
  lat: number;
  lng: number;
}

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const pickupIcon = createCustomIcon('#22c55e');
const dropoffIcon = createCustomIcon('#ef4444');

// Component to handle map updates and routing
function MapUpdater({ 
  coords,
  onDistanceCalculated 
}: { 
  coords: Coordinates[];      // includes pickup + stops + dropoff
  onDistanceCalculated?: (distanceKm: number, durationMinutes: number) => void;
}) {
  const map = useMap();
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (coords.length >= 2) {
      // fit bounds covering all points
      const bounds = L.latLngBounds(coords.map(c => [c.lat, c.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });

      // build coordinate string for OSRM
      const coordString = coords.map(c => `${c.lng},${c.lat}`).join(";");

      const fetchRoute = async () => {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`
          );
          const data = await response.json();

          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);

            if (routeLayerRef.current) {
              map.removeLayer(routeLayerRef.current);
            }
            routeLayerRef.current = L.polyline(coordinates, {
              color: '#f97316',
              weight: 5,
              opacity: 0.8,
            }).addTo(map);

            const distanceKm = route.distance / 1000;
            const durationMinutes = Math.ceil(route.duration / 60);
            if (onDistanceCalculated) onDistanceCalculated(distanceKm, durationMinutes);
          }
        } catch (error) {
          console.error('Error fetching route:', error);
          if (onDistanceCalculated) {
            // fallback: sum straight-line distances
            let total = 0;
            for (let i = 1; i < coords.length; i++) {
              total += calculateDistance(coords[i - 1], coords[i]);
            }
            onDistanceCalculated(total, Math.ceil(total * 2));
          }
        }
      };

      fetchRoute();
    } else {
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
    }
  }, [map, coords, onDistanceCalculated]);

  return null;
}

// Helper function to calculate straight-line distance
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function MapComponent({ pickup, stops = [], dropoff, onDistanceCalculated }: MapComponentProps) {
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [stopCoords, setStopCoords] = useState<Coordinates[]>([]);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geocode addresses to coordinates using Nominatim (free OpenStreetMap geocoding)
  useEffect(() => {
    const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          {
            headers: {
              'User-Agent': 'RideSwift/1.0', // Required by Nominatim
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
        return null;
      } catch (error) {
        console.error('Geocoding error:', error);
        return null;
      }
    };

    const geocodeAddresses = async () => {
      setLoading(true);
      setError(null);

      try {
        if (pickup) {
          const coords = await geocodeAddress(pickup);
          setPickupCoords(coords);
        } else {
          setPickupCoords(null);
        }

        const stopsArray: Coordinates[] = [];
        if (Array.isArray(stops) && stops.length > 0) {
          for (let i = 0; i < stops.length; i++) {
            // delay to respect rate limit
            await new Promise(r => setTimeout(r, 1000));
            const coords = await geocodeAddress(stops[i]);
            if (coords) stopsArray.push(coords);
          }
        }
        setStopCoords(stopsArray);

        if (dropoff) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const coords = await geocodeAddress(dropoff);
          setDropoffCoords(coords);
        } else {
          setDropoffCoords(null);
        }
      } catch (err) {
        setError('Failed to load map locations');
      } finally {
        setLoading(false);
      }
    };

    geocodeAddresses();
  }, [pickup, stops, dropoff]);

  return (
    <div className="relative h-56 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={[40.7128, -74.006]}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={false}
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickupCoords && (
          <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-sm font-medium">
                <div className="text-green-600 font-semibold mb-1">📍 Pickup</div>
                <div className="text-gray-700 text-xs">{pickup}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* stop markers */}
        {stopCoords.map((coords, idx) => (
          <Marker key={idx} position={[coords.lat, coords.lng]} icon={createCustomIcon('#facc15')}>
            <Popup>
              <div className="text-sm font-medium">
                <div className="text-yellow-600 font-semibold mb-1">📍 Stop {idx + 1}</div>
                <div className="text-gray-700 text-xs">{stops[idx]}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {dropoffCoords && (
          <Marker position={[dropoffCoords.lat, dropoffCoords.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="text-sm font-medium">
                <div className="text-red-600 font-semibold mb-1">📍 Drop-off</div>
                <div className="text-gray-700 text-xs">{dropoff}</div>
              </div>
            </Popup>
          </Marker>
        )}

        <MapUpdater 
          coords={[
            ...(pickupCoords ? [pickupCoords] : []),
            ...stopCoords,
            ...(dropoffCoords ? [dropoffCoords] : []),
          ]}
          onDistanceCalculated={onDistanceCalculated}
        />
      </MapContainer>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-cyber-dark-800/90 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-cyber-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-cyber-purple-400 text-sm">Loading map…</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-cyber-dark-800/90 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-cyber-purple-500/30 rounded-xl z-10">
          <MapPin className="w-10 h-10 text-cyber-purple-400 mb-2" />
          <p className="text-cyber-purple-400 text-sm text-center px-4">{error}</p>
        </div>
      )}
    </div>
  );
}

