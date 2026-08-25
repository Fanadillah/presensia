'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/Button';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  open: boolean;
  src: string | null;
  onClose: () => void;
  onCrop: (blob: Blob) => void;
}

export function AvatarCropper({ open, src, onClose, onCrop }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; posX: number; posY: number } | null>(null);

  const CONTAINER = 280;
  const OUTPUT = 400;

  useEffect(() => {
    if (open) {
      setZoom(1);
      setPos({ x: 0, y: 0 });
      setNatural(null);
    }
  }, [open, src]);

  const onImgLoad = useCallback(() => {
    if (imgRef.current) {
      setNatural({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  }, []);

  const baseScale = natural ? Math.max(CONTAINER / natural.w, CONTAINER / natural.h) : 1;
  const baseScaleOut = natural ? Math.max(OUTPUT / natural.w, OUTPUT / natural.h) : 1;

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    // clamp biar tidak keluar terlalu jauh
    const max = 120 * zoom;
    const nx = Math.max(-max, Math.min(max, dragStart.posX + dx));
    const ny = Math.max(-max, Math.min(max, dragStart.posY + dy));
    setPos({ x: nx, y: ny });
  };
  const handlePointerUp = () => {
    setDragging(false);
    setDragStart(null);
  };

  const handleCrop = async () => {
    if (!src || !natural) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    await new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = rej;
    });
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // clip circle
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();
    // draw
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    const drawW = natural.w * baseScaleOut * zoom;
    const drawH = natural.h * baseScaleOut * zoom;
    const scaleRatio = OUTPUT / CONTAINER;
    const dx = OUTPUT / 2 - drawW / 2 + pos.x * scaleRatio;
    const dy = OUTPUT / 2 - drawH / 2 + pos.y * scaleRatio;
    ctx.drawImage(img, dx, dy, drawW, drawH);
    canvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      'image/jpeg',
      0.85
    );
  };

  if (!open || !src) return null;

  return (
    <Modal open={open} onClose={onClose} title="Atur Posisi Foto">
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Drag untuk geser, zoom untuk sesuaikan wajah di lingkaran</p>
        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-full bg-gray-100 select-none touch-none"
            style={{ width: CONTAINER, height: CONTAINER }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="crop preview"
              onLoad={onImgLoad}
              draggable={false}
              className="absolute left-1/2 top-1/2 max-none select-none"
              style={{
                width: natural ? natural.w * baseScale : undefined,
                height: natural ? natural.h * baseScale : undefined,
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                cursor: dragging ? 'grabbing' : 'grab',
              }}
            />
            {/* circle border */}
            <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            {/* grid */}
            <div className="pointer-events-none absolute inset-0 rounded-full border border-white/20" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
          <span className="w-10 text-right text-xs tabular-nums">{zoom.toFixed(2)}x</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleCrop}>Simpan Posisi</Button>
        </div>
      </div>
    </Modal>
  );
}
