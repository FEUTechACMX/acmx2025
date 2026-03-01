"use client";

import { useState, useCallback, useEffect } from "react";

interface EventGalleryProps {
  images: string[];
  eventName: string;
}

export default function EventGallery({ images, eventName }: EventGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const total = images.length;

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? total - 1 : c - 1));
  }, [total]);

  const next = useCallback(() => {
    setCurrent((c) => (c === total - 1 ? 0 : c + 1));
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next]);

  if (total === 0) return null;

  const renderCarousel = (isFullscreen: boolean) => (
    <div className={`relative ${isFullscreen ? "w-full h-full flex flex-col items-center justify-center" : ""}`}>
      {/* Image */}
      <div className={`relative overflow-hidden ${isFullscreen ? "flex-1 flex items-center justify-center w-full" : "aspect-[16/10] bg-gray-50 border border-gray-100"}`}>
        <img
          src={images[current]}
          alt={`${eventName} photo ${current + 1}`}
          className={`${isFullscreen ? "max-w-full max-h-full object-contain" : "w-full h-full object-cover"}`}
        />

        {/* Prev button */}
        {total > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 flex items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer border border-gray-200 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {total > 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 flex items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer border border-gray-200 transition-colors"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Fullscreen toggle */}
        {!isFullscreen && (
          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer border border-gray-200 transition-colors"
            aria-label="Fullscreen"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
            </svg>
          </button>
        )}
      </div>

      {/* Counter + Dots */}
      <div className={`flex items-center justify-center gap-3 ${isFullscreen ? "mt-4" : "mt-3"}`}>
        <span className={`text-xs font-['Arian-bold'] ${isFullscreen ? "text-white/60" : "text-gray-400"}`}>
          {current + 1} / {total}
        </span>
        {total > 1 && total <= 20 && (
          <div className="flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 transition-colors cursor-pointer ${
                  i === current
                    ? isFullscreen ? "bg-white" : "bg-[#CF78EC]"
                    : isFullscreen ? "bg-white/30" : "bg-gray-200"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {renderCarousel(false)}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Close button */}
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer transition-colors"
            aria-label="Close fullscreen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex-1 flex items-center justify-center p-8">
            {renderCarousel(true)}
          </div>
        </div>
      )}
    </>
  );
}
