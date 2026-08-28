'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Geofence } from '@/types';

interface Props {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  isWithinGeofence?: boolean | null;
  geofence?: Pick<Geofence, 'latitude' | 'longitude' | 'radius_meters' | 'name'> | null;
  employeeName?: string;
  recordedAt?: string;
  height?: string;
}

export default function AttendanceMiniMap({
  latitude,
  longitude,
  accuracy,
  isWithinGeofence,
  geofence,
  employeeName,
  recordedAt,
  height = '300px',
}: Props) {
  const center: [number, number] = useMemo(() => [latitude, longitude], [latitude, longitude]);

  const zoom = useMemo(() => {
    if (geofence) return 16;
    if (accuracy && accuracy > 200) return 14;
    return 17;
  }, [geofence, accuracy]);

  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        dragging
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geofence && (
          <Circle
            center={[geofence.latitude, geofence.longitude]}
            radius={geofence.radius_meters}
            pathOptions={{
              color: '#2563eb',
              weight: 2,
              fillColor: '#2563eb',
              fillOpacity: 0.12,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} permanent>
              {geofence.name}
            </Tooltip>
          </Circle>
        )}

        {accuracy ? (
          <Circle
            center={center}
            radius={Math.min(accuracy, 500)}
            pathOptions={{
              color: isWithinGeofence === false ? '#ef4444' : '#22c55e',
              weight: 1,
              fillColor: isWithinGeofence === false ? '#ef4444' : '#22c55e',
              fillOpacity: 0.08,
            }}
          />
        ) : null}

        <CircleMarker
          center={center}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            weight: 3,
            fillColor: isWithinGeofence === false ? '#ef4444' : '#22c55e',
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <div className="text-xs">
              {employeeName && <p className="font-semibold">{employeeName}</p>}
              <p>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
              {recordedAt && <p>{new Date(recordedAt).toLocaleString('id-ID')}</p>}
              {accuracy != null && <p>Akurasi ±{Math.round(accuracy)} m</p>}
            </div>
          </Tooltip>
        </CircleMarker>

        {geofence && (
          <CircleMarker
            center={[geofence.latitude, geofence.longitude]}
            radius={5}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: '#2563eb',
              fillOpacity: 1,
            }}
          >
            <Tooltip>Kantor: {geofence.name}</Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
