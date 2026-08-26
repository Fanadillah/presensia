'use client';

import { useEffect, useState } from 'react';
import { Camera, RotateCcw, Check, X } from '@/components/icons';
import { useCamera } from '@/hooks/useCamera';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface CameraCaptureProps {
  onCapture: (photo: Blob) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const { videoRef, canvasRef, stream, photoUrl, loading, error, startCamera, capturePhotoAsync, stopCamera, resetPhoto } = useCamera();
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Re-attach stream when coming back from preview (video remounted)
  useEffect(() => {
    if (!captured && stream && videoRef.current && !loading && !error) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [captured, stream, loading, error]);

  const handleCapture = async () => {
    const blob = await capturePhotoAsync();
    if (blob) {
      setCaptured(true);
    }
  };

  const handleConfirm = async () => {
    if (photoUrl) {
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      onCapture(blob);
    }
    stopCamera();
  };

  const handleRetake = () => {
    resetPhoto();
    setCaptured(false);
    // Re-attach stream to new video element after retake (video was unmounted when captured)
    requestAnimationFrame(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between bg-black px-4 py-3">
        <button onClick={() => { stopCamera(); onClose(); }} className="text-white">
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium text-white">Ambil Selfie</span>
        <div className="w-6" />
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="lg" className="border-white border-t-blue-500" />
          </div>
        )}

        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <Camera className="h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-300">{error}</p>
            <button onClick={startCamera} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && !captured && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover [transform:scaleX(-1)]"
          />
        )}

        {captured && photoUrl && (
          <img src={photoUrl} alt="Preview" className="h-full w-full object-cover [transform:scaleX(-1)]" />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-8 bg-black py-6">
        {!captured ? (
          <button
            onClick={handleCapture}
            disabled={loading || !!error}
            className="h-16 w-16 rounded-full border-4 border-white bg-transparent transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <div className="mx-auto h-12 w-12 rounded-full bg-white" />
          </button>
        ) : (
          <>
            <button
              onClick={handleRetake}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-700 text-white"
            >
              <RotateCcw className="h-6 w-6" />
            </button>
            <button
              onClick={handleConfirm}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white"
            >
              <Check className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
