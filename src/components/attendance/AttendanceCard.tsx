'use client';

import { useState, useEffect } from 'react';
import { CheckIn, CheckOut, Clock, MapPin } from '@/components/icons';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAttendance } from '@/hooks/useAttendance';
import { CameraCapture } from './CameraCapture';
import { GPSStatus } from './GPSStatus';
import { useToast } from '@/components/shared/Toast';
import type { AttendanceToday } from '@/types';

export function AttendanceCard() {
  const [showCamera, setShowCamera] = useState(false);
  const [actionType, setActionType] = useState<'check_in' | 'check_out'>('check_in');
  const [today, setToday] = useState<AttendanceToday | null>(null);
  const geo = useGeolocation();
  const { loading, checkIn, checkOut, getToday } = useAttendance();
  const { addToast } = useToast();

  useEffect(() => {
    getToday().then(setToday);
  }, []);

  const handleAction = (type: 'check_in' | 'check_out') => {
    setActionType(type);
    setShowCamera(true);
  };

  const handleCapture = async (photo: Blob) => {
    setShowCamera(false);
    if (!geo.latitude || !geo.longitude) {
      addToast('error', 'GPS tidak aktif. Silakan aktifkan lokasi.');
      return;
    }

    const fn = actionType === 'check_in' ? checkIn : checkOut;
    const result = await fn(photo, geo.latitude, geo.longitude, geo.accuracy || 0);

    if (result) {
      addToast('success', `Berhasil ${actionType === 'check_in' ? 'check-in' : 'check-out'}!`);
      const updated = await getToday();
      setToday(updated);
    } else {
      addToast('error', `Gagal ${actionType === 'check_in' ? 'check-in' : 'check-out'}`);
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          {/* Date & Time */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900">
              <Clock className="h-7 w-7 text-blue-600" />
              {timeStr}
            </div>
            <p className="mt-1 text-sm text-gray-500">{dateStr}</p>
          </div>

          {/* GPS Status */}
          <div className="mb-4">
            <GPSStatus
              latitude={geo.latitude}
              longitude={geo.longitude}
              accuracy={geo.accuracy}
              loading={geo.loading}
              error={geo.error}
            />
          </div>

          {/* Status Hari Ini */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Check-in:</span>
              <span className={`font-medium ${today?.has_check_in ? 'text-green-600' : 'text-gray-400'}`}>
                {today?.check_in
                  ? new Date(today.check_in.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : '-'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">Check-out:</span>
              <span className={`font-medium ${today?.has_check_out ? 'text-green-600' : 'text-gray-400'}`}>
                {today?.check_out
                  ? new Date(today.check_out.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : '-'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!today?.has_check_in ? (
              <button
                onClick={() => handleAction('check_in')}
                disabled={loading || geo.loading || !!geo.error}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
              >
                <CheckIn className="h-6 w-6" />
                CHECK IN
              </button>
            ) : !today?.has_check_out ? (
              <button
                onClick={() => handleAction('check_out')}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50"
              >
                <CheckOut className="h-6 w-6" />
                CHECK OUT
              </button>
            ) : (
              <div className="rounded-xl bg-green-50 p-4 text-center">
                <p className="text-sm font-medium text-green-700">Absensi hari ini sudah selesai</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}
    </>
  );
}
