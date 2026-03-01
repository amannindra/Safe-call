import { useCallback, useMemo, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';
import { MapPin, X, Trash2, Target, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { ScenarioTargetLocation } from '../scenarios';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

type Pin = { id: string; lat: number; lng: number };

type MapStyle = { elementType?: string; featureType?: string; stylers: Record<string, string>[] };

const MAP_STYLES: MapStyle[] = [
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

/** Haversine distance in metres between two lat/lng points. */
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type AccuracyTier = {
  label: string;
  colour: string;      // Tailwind text colour
  barColour: string;   // Tailwind bg colour
  barWidth: string;    // Tailwind width class
};

function getAccuracy(metres: number): AccuracyTier {
  if (metres < 150)   return { label: 'Exact',        colour: 'text-emerald-400', barColour: 'bg-emerald-400', barWidth: 'w-full' };
  if (metres < 500)   return { label: 'Very Close',   colour: 'text-green-400',   barColour: 'bg-green-400',   barWidth: 'w-4/5' };
  if (metres < 2000)  return { label: 'Close',        colour: 'text-yellow-400',  barColour: 'bg-yellow-400',  barWidth: 'w-3/5' };
  if (metres < 8000)  return { label: 'In the Area',  colour: 'text-orange-400',  barColour: 'bg-orange-400',  barWidth: 'w-2/5' };
  return               { label: 'Off Target',  colour: 'text-red-400',    barColour: 'bg-red-400',    barWidth: 'w-1/5' };
}

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(2)} km`;
}

// ─── Markers ────────────────────────────────────────────────────────────────

function GuessPinMarker({ pin, onDelete }: { pin: Pin; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <AdvancedMarker position={{ lat: pin.lat, lng: pin.lng }} onClick={() => setOpen((v) => !v)}>
      <div className="relative flex flex-col items-center">
        {open && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(pin.id); }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1
              bg-red-500 hover:bg-red-600 text-white text-xs font-medium
              px-2 py-1 rounded-lg shadow-lg whitespace-nowrap transition-colors z-10"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        )}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 transition-colors
          ${open ? 'bg-red-500 border-red-300' : 'bg-elevenlabs-accent border-indigo-300 hover:bg-indigo-500'}`}>
          <MapPin className="w-4 h-4 text-white" />
        </div>
      </div>
    </AdvancedMarker>
  );
}

function TargetMarker({ location }: { location: ScenarioTargetLocation }) {
  return (
    <AdvancedMarker position={{ lat: location.lat, lng: location.lng }}>
      <div className="relative flex flex-col items-center">
        {/* Pulsing ring */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-30" />
        </span>
        <div className="relative w-9 h-9 rounded-full flex items-center justify-center
          bg-emerald-500 border-2 border-emerald-300 shadow-lg shadow-emerald-500/40 z-10">
          <Target className="w-5 h-5 text-white" />
        </div>
        <span className="mt-1 px-2 py-0.5 rounded-md text-xs font-semibold
          bg-emerald-900/80 text-emerald-300 whitespace-nowrap shadow backdrop-blur-sm border border-emerald-700">
          {location.label}
        </span>
      </div>
    </AdvancedMarker>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type MapPanelProps = {
  targetLocation?: ScenarioTargetLocation;
};

export function MapPanel({ targetLocation }: MapPanelProps = {}) {
  // Scenario mode: single guess pin
  const [guessPin, setGuessPin] = useState<Pin | null>(null);
  const [targetRevealed, setTargetRevealed] = useState(false);

  // Free mode: multi-pin
  const [pins, setPins] = useState<Pin[]>([]);

  const isScenarioMode = !!targetLocation;

  const defaultCenter = useMemo(
    () => targetLocation ? { lat: targetLocation.lat, lng: targetLocation.lng } : { lat: 39.8283, lng: -98.5795 },
    [targetLocation],
  );
  const defaultZoom = targetLocation ? 12 : 4;

  const distanceMetres = useMemo(() => {
    if (!guessPin || !targetLocation) return null;
    return haversineMetres(guessPin.lat, guessPin.lng, targetLocation.lat, targetLocation.lng);
  }, [guessPin, targetLocation]);

  const accuracy = distanceMetres !== null ? getAccuracy(distanceMetres) : null;

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const { lat, lng } = e.detail.latLng;
    if (isScenarioMode) {
      setGuessPin({ id: 'guess', lat, lng });
      setTargetRevealed(true);
    } else {
      setPins((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, lat, lng }]);
    }
  }, [isScenarioMode]);

  const handleReset = useCallback(() => {
    setGuessPin(null);
    setTargetRevealed(false);
  }, []);

  const handleDeleteFreePin = useCallback((id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
  }, []);

  if (!API_KEY) {
    return (
      <div className="rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-elevenlabs-accent" />
          <h2 className="text-base font-semibold">Map</h2>
        </div>
        <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-elevenlabs-border">
          <p className="text-sm text-elevenlabs-muted text-center px-4">
            Add{' '}
            <code className="text-white/70 bg-elevenlabs-border px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
            to your <code className="text-white/70 bg-elevenlabs-border px-1 rounded">.env</code> to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-6 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-elevenlabs-accent" />
            <h2 className="text-base font-semibold">Map</h2>
            {isScenarioMode && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-elevenlabs-accent/20 text-indigo-300 border border-indigo-500/30">
                Scenario
              </span>
            )}
            {!isScenarioMode && pins.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-elevenlabs-border text-elevenlabs-muted">
                {pins.length} {pins.length === 1 ? 'pin' : 'pins'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isScenarioMode && guessPin && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-elevenlabs-muted hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try again
              </button>
            )}
            {!isScenarioMode && pins.length > 0 && (
              <button
                onClick={() => setPins([])}
                className="flex items-center gap-1.5 text-xs text-elevenlabs-muted hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-elevenlabs-border" style={{ height: 320 }}>
          <Map
            mapId="dark-map"
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            styles={MAP_STYLES}
            onClick={handleMapClick}
            className="w-full h-full"
          >
            {isScenarioMode ? (
              <>
                {guessPin && <GuessPinMarker pin={guessPin} onDelete={handleReset} />}
                {targetRevealed && targetLocation && <TargetMarker location={targetLocation} />}
              </>
            ) : (
              pins.map((pin) => (
                <GuessPinMarker key={pin.id} pin={pin} onDelete={handleDeleteFreePin} />
              ))
            )}
          </Map>
        </div>

        {/* Distance result (scenario mode only) */}
        {isScenarioMode && distanceMetres !== null && accuracy && (
          <div className="rounded-xl border border-elevenlabs-border bg-elevenlabs-dark p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${accuracy.colour}`} />
                <span className={`text-sm font-semibold ${accuracy.colour}`}>{accuracy.label}</span>
              </div>
              <span className="text-sm font-mono text-white/80">
                {formatDistance(distanceMetres)} from target
              </span>
            </div>
            {/* Accuracy bar */}
            <div className="h-1.5 w-full rounded-full bg-elevenlabs-border overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${accuracy.barColour} ${accuracy.barWidth}`} />
            </div>
            <p className="text-xs text-elevenlabs-muted">
              Target: <span className="text-white/70">{targetLocation?.label}</span>
              {' · '}Green marker shows the actual location
            </p>
          </div>
        )}

        {/* Hint text */}
        {isScenarioMode && !guessPin && (
          <p className="text-xs text-elevenlabs-muted">
            Listen to the caller and click the map to mark where you think they are.
          </p>
        )}
        {!isScenarioMode && (
          <p className="text-xs text-elevenlabs-muted">
            Click anywhere to drop a pin · Click a pin to remove it
          </p>
        )}
      </div>
    </APIProvider>
  );
}
