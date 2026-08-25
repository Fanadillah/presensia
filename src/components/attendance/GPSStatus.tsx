'use client';

import { MapPin, AlertTriangle } from '@/components/icons';
import { cn } from '@/lib/utils';

interface GPSStatusProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export function GPSStatus({ latitude, longitude, accuracy, loading, error }: GPSStatusProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
        <span>Mengambil lokasi GPS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span>GPS: {error}</span>
      </div>
    );
  }

  if (latitude && longitude) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <MapPin className="h-4 w-4" />
        <span>
          GPS aktif {accuracy && `(${Math.round(accuracy)}m akurasi)`}
        </span>
      </div>
    );
  }

  return null;
}
