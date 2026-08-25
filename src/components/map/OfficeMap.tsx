'use client';

import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistance } from '@/lib/geofence';

export interface MapGeofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface MapUserPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface OfficeMapProps {
  geofences: MapGeofence[];
  userPosition: MapUserPosition | null;
  height?: string;
  zoom?: number;
}

function fitBoundsCenter(geofences: MapGeofence[], user: MapUserPosition | null): {
  center: [number, number];
  zoom: number;
} {
  const points: [number, number][] = [
    ...geofences.map((g) => [g.latitude, g.longitude] as [number, number]),
    ...(user ? ([[user.latitude, user.longitude]] as [number, number][]) : []),
  ];
  if (points.length === 0) return { center: [-6.2, 106.816666], zoom: 13 };
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
  const lng = points.reduce((s, p) => s + p[1], 0) / points.length;

  // Zoom kasar berdasarkan jarak terjauh antar titik
  let maxDist = 0;
  for (const a of points) {
    for (const b of points) {
      maxDist = Math.max(maxDist, calculateDistance(a[0], a[1], b[0], b[1]));
    }
  }
  let zoom = 15;
  if (maxDist > 3000) zoom = 11;
  else if (maxDist > 1500) zoom = 12;
  else if (maxDist > 700) zoom = 13;
  else if (maxDist > 250) zoom = 14;
  else if (user && user.accuracy && user.accuracy > 100) zoom = 14;
  return { center: [lat, lng], zoom };
}

export default function OfficeMap({
  geofences,
  userPosition,
  height = '320px',
  zoom,
}: OfficeMapProps) {
  const fit = fitBoundsCenter(geofences, userPosition);

  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
      <MapContainer
        center={fit.center}
        zoom={zoom ?? fit.zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geofences.map((g) => (
          <Circle
            key={g.id}
            center={[g.latitude, g.longitude]}
            radius={g.radius_meters}
            pathOptions={{
              color: '#2563eb',
              weight: 2,
              fillColor: '#2563eb',
              fillOpacity: 0.12,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} permanent>
              {g.name}
            </Tooltip>
          </Circle>
        ))}

        {userPosition && (
          <>
            {userPosition.accuracy ? (
              <Circle
                center={[userPosition.latitude, userPosition.longitude]}
                radius={Math.min(userPosition.accuracy, 500)}
                pathOptions={{
                  color: '#22c55e',
                  weight: 1,
                  fillColor: '#22c55e',
                  fillOpacity: 0.1,
                }}
              />
            ) : null}
            <CircleMarker
              center={[userPosition.latitude, userPosition.longitude]}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                fillColor: '#22c55e',
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                Posisi Anda
              </Tooltip>
            </CircleMarker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
