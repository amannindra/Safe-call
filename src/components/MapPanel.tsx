import { useCallback, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';
import { MapPin, X, Trash2 } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

type Pin = {
  id: string;
  lat: number;
  lng: number;
};

const DARK_MAP_ID = 'dark-map';

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#737373' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f0f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f0f0f' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a3a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#222222' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
];

function PinMarker({ pin, onDelete }: { pin: Pin; onDelete: (id: string) => void }) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <AdvancedMarker
      position={{ lat: pin.lat, lng: pin.lng }}
      onClick={() => setShowDelete((v) => !v)}
    >
      <div className="relative flex flex-col items-center">
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(pin.id);
            }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1
              bg-red-500 hover:bg-red-600 text-white text-xs font-medium
              px-2 py-1 rounded-lg shadow-lg whitespace-nowrap transition-colors z-10"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        )}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 transition-colors
            ${showDelete
              ? 'bg-red-500 border-red-300'
              : 'bg-elevenlabs-accent border-indigo-300 hover:bg-indigo-500'
            }`}
        >
          <MapPin className="w-4 h-4 text-white" />
        </div>
      </div>
    </AdvancedMarker>
  );
}

export function MapPanel() {
  const [pins, setPins] = useState<Pin[]>([]);

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const { lat, lng } = e.detail.latLng;
    setPins((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, lat, lng },
    ]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleClearAll = useCallback(() => setPins([]), []);

  if (!API_KEY) {
    return (
      <div className="rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-elevenlabs-accent" />
          <h2 className="text-base font-semibold">Map</h2>
        </div>
        <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-elevenlabs-border">
          <p className="text-sm text-elevenlabs-muted text-center px-4">
            Add <code className="text-white/70 bg-elevenlabs-border px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your <code className="text-white/70 bg-elevenlabs-border px-1 rounded">.env</code> file to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-elevenlabs-accent" />
            <h2 className="text-base font-semibold">Map</h2>
            {pins.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-elevenlabs-border text-elevenlabs-muted">
                {pins.length} {pins.length === 1 ? 'pin' : 'pins'}
              </span>
            )}
          </div>
          {pins.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs text-elevenlabs-muted hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>

        <div className="rounded-xl overflow-hidden border border-elevenlabs-border" style={{ height: 320 }}>
          <Map
            mapId={DARK_MAP_ID}
            defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
            defaultZoom={4}
            gestureHandling="greedy"
            disableDefaultUI={false}
            styles={MAP_STYLES}
            onClick={handleMapClick}
            className="w-full h-full"
          >
            {pins.map((pin) => (
              <PinMarker key={pin.id} pin={pin} onDelete={handleDelete} />
            ))}
          </Map>
        </div>

        <p className="text-xs text-elevenlabs-muted">
          Click anywhere on the map to drop a pin · Click a pin to remove it
        </p>
      </div>
    </APIProvider>
  );
}
