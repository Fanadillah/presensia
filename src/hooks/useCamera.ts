'use client';

import { useState, useCallback, useRef } from 'react';
import { PHOTO_CLIENT_MAX_WIDTH, PHOTO_CLIENT_QUALITY } from '@/lib/constants';

interface CameraState {
  stream: MediaStream | null;
  photo: Blob | null;
  photoUrl: string | null;
  loading: boolean;
  error: string | null;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<CameraState>({
    stream: null,
    photo: null,
    photoUrl: null,
    loading: false,
    error: null,
  });

  const startCamera = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setState((prev) => ({ ...prev, stream, loading: false }));
      return stream;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengakses kamera';
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      return null;
    }
  }, []);

  const capturePhoto = useCallback((): Blob | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const maxW = PHOTO_CLIENT_MAX_WIDTH;
    const scale = Math.max(vw, vh) > maxW ? maxW / Math.max(vw, vh) : 1;
    const cw = Math.round(vw * scale);
    const ch = Math.round(vh * scale);

    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, cw, ch);

    let blob: Blob | null = null;
    canvas.toBlob(
      (b) => {
        blob = b;
        if (b) {
          const url = URL.createObjectURL(b);
          setState((prev) => ({ ...prev, photo: b, photoUrl: url }));
        }
      },
      'image/jpeg',
      PHOTO_CLIENT_QUALITY
    );

    return blob;
  }, []);

  const capturePhotoAsync = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // Client pre-resize Opsi A: max 1024 agar hemat bandwidth tanpa blur watermark
    const maxW = PHOTO_CLIENT_MAX_WIDTH;
    const scale = Math.max(vw, vh) > maxW ? maxW / Math.max(vw, vh) : 1;
    const cw = Math.round(vw * scale);
    const ch = Math.round(vh * scale);

    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, cw, ch);

    return new Promise((resolve) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            const url = URL.createObjectURL(b);
            setState((prev) => ({ ...prev, photo: b, photoUrl: url }));
          }
          resolve(b);
        },
        'image/jpeg',
        PHOTO_CLIENT_QUALITY
      );
    });
  }, []);

  const stopCamera = useCallback(() => {
    state.stream?.getTracks().forEach((t) => t.stop());
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    setState({ stream: null, photo: null, photoUrl: null, loading: false, error: null });
  }, [state.stream, state.photoUrl]);

  const resetPhoto = useCallback(() => {
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    setState((prev) => ({ ...prev, photo: null, photoUrl: null }));
  }, [state.photoUrl]);

  return {
    ...state,
    videoRef,
    canvasRef,
    startCamera,
    capturePhoto,
    capturePhotoAsync,
    stopCamera,
    resetPhoto,
  };
}
