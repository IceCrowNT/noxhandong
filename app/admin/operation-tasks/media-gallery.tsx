"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type MediaGalleryProps = {
  mediaUrls: string | string[];
  thumbnailClassName?: string;
};

export function MediaGallery({ mediaUrls, thumbnailClassName = "h-20 object-contain" }: MediaGalleryProps) {
  const urls = Array.isArray(mediaUrls) ? mediaUrls : [mediaUrls];
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeLightbox = () => setIsOpen(false);

  const nextMedia = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  }, [urls.length]);

  const prevMedia = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  }, [urls.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextMedia();
      if (e.key === "ArrowLeft") prevMedia();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, nextMedia, prevMedia]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {urls.map((mediaUrl, i) => {
          const isVideo = mediaUrl.match(/\.(mp4|webm|mov)$/i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => openLightbox(i)}
              className="block shrink-0"
            >
              {isVideo ? (
                <video src={mediaUrl} className={`${thumbnailClassName} rounded border border-[var(--line)] hover:opacity-80 bg-slate-50`} />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={mediaUrl} alt={`Bằng chứng ${i + 1}`} className={`${thumbnailClassName} rounded border border-[var(--line)] hover:opacity-80 bg-slate-50`} />
              )}
            </button>
          );
        })}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closeLightbox}
            aria-label="Close background"
          />
          
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25"
            onClick={closeLightbox}
          >
            <X size={24} />
          </button>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25"
                onClick={prevMedia}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25"
                onClick={nextMedia}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <div className="relative z-0 max-h-full max-w-full">
            {urls[currentIndex].match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={urls[currentIndex]}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={urls[currentIndex]}
                alt={`Bằng chứng ${currentIndex + 1}`}
                className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
              />
            )}
            {urls.length > 1 && (
              <div className="absolute -bottom-8 left-0 right-0 text-center text-sm text-white/80">
                {currentIndex + 1} / {urls.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
