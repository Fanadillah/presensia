'use client';

import { useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, LocateFixed, Loader2, MapPin } from 'lucide-react';

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapPickerProps {
  position: { lat: number; lng: number } | null;
  radiusMeters: number;
  onChange?: (pos: { lat: number; lng: number }) => void;
  onAddressFound?: (address: string) => void;
  height?: string;
  editable?: boolean;
}

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="transform: translate(-50%, -100%)">
    <svg width="32" height="42" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z"
        fill="#dc2626" stroke="#fff" stroke-width="1.6"/>
      <circle cx="12" cy="12" r="4.4" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

function Recenter({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  if (position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15), { animate: true });
  return null;
}

function ClickHandler({
  onChange,
}: {
  onChange: (pos: { lat: number; lng: number }) => void;
}) {
  const map = useMap();
  map.on('click', (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }));
  return null;
}

function DraggableMarker({
  position,
  onChange,
}: {
  position: { lat: number; lng: number };
  onChange?: (pos: { lat: number; lng: number }) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  return (
    <Marker
      ref={markerRef}
      position={[position.lat, position.lng]}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend() {
          const ll = markerRef.current?.getLatLng();
          if (ll && onChange) onChange({ lat: ll.lat, lng: ll.lng });
        },
      }}
    />
  );
}

export default function MapPicker({
  position,
  radiusMeters,
  onChange,
  onAddressFound,
  height = '320px',
  editable = true,
}: MapPickerProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query.trim())}`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
      if (data.length === 0) setError('Lokasi tidak ditemukan. Coba kata kunci lain.');
    } catch {
      setError('Pencarian gagal. Periksa koneksi internet.');
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r: NominatimResult) => {
    const pos = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    onChange?.(pos);
    onAddressFound?.(r.display_name);
    setResults([]);
    setQuery(r.display_name.split(',')[0]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('GPS tidak didukung browser ini.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange?.({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setError(err.message || 'Gagal mengambil lokasi GPS.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      {/* Toolbar pencarian */}
      {editable && (
        <div className="mb-2 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cari nama tempat atau alamat…"
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Cari
            </button>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              title="Gunakan lokasi saya saat ini"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Lokasi Saya</span>
            </button>
          </div>

          {results.length > 0 && (
            <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-card">
              {results.map((r, i) => (
                <li key={`${r.lat}-${r.lon}-${i}`}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-surface-muted cursor-pointer"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}

      {/* Peta */}
      <div
        className="relative overflow-hidden rounded-xl border border-border"
        style={{ height }}
      >
        <MapContainer
          center={position ? [position.lat, position.lng] : [-6.2, 106.816666]}
          zoom={position ? 15 : 12}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {editable && onChange && (
            <>
              <ClickHandler onChange={onChange} />
              <Recenter position={position} />
            </>
          )}
          {position && (
            <>
              <DraggableMarker position={position} onChange={onChange} />
              <Circle
                center={[position.lat, position.lng]}
                radius={radiusMeters || 1}
                pathOptions={{
                  color: '#2563eb',
                  weight: 2,
                  fillColor: '#2563eb',
                  fillOpacity: 0.12,
                }}
              />
            </>
          )}
        </MapContainer>

        {!position && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] flex justify-center">
            <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              Klik peta untuk menaruh pin
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
