'use client';

import Image from 'next/image';
import type { PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';

import 'keen-slider/keen-slider.min.css';

const PostImageGallery = ({ images }: { images: string[] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [ready, setReady] = useState(false);
  const targetSlideRef = useRef(0);

  const syncSlide = (index: number) => {
    targetSlideRef.current = index;
    setCurrentSlide(index);
  };

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    created(slider) {
      setReady(true);
      requestAnimationFrame(() => slider.update());
    },
    animationEnded(slider) {
      syncSlide(slider.track.details.rel);
    },
    dragEnded(slider) {
      syncSlide(slider.track.details.rel);
    },
  });

  useEffect(() => {
    if (!instanceRef.current) return;
    requestAnimationFrame(() => instanceRef.current?.update());
  }, [images, instanceRef]);

  if (!images.length) return null;

  const goBy = (delta: -1 | 1) => {
    const safeIndex = Math.max(0, Math.min(targetSlideRef.current + delta, images.length - 1));
    const slider = instanceRef.current;

    if (safeIndex === targetSlideRef.current) return;

    syncSlide(safeIndex);

    if (!slider) return;

    slider.animator.stop();
    slider.moveToIdx(safeIndex, true, { duration: 280 });
  };

  const handlePreviousPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    goBy(-1);
  };

  const handleNextPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    goBy(1);
  };

  return (
    <div className='mt-5 w-full min-w-0 overflow-hidden'>
      <div className='relative w-full overflow-hidden rounded'>
        <div
          ref={sliderRef}
          className={`keen-slider aspect-3/2 w-full bg-muted transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}
        >
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className='keen-slider__slide relative'>
              <Image
                src={url}
                alt=''
                fill
                unoptimized
                sizes='(max-width: 768px) calc(100vw - 5rem), 760px'
                className='object-cover'
                draggable={false}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type='button'
              aria-disabled={currentSlide === 0}
              className='absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white aria-disabled:opacity-30'
              onPointerDown={handlePreviousPointerDown}
            >
              ‹
            </button>

            <button
              type='button'
              aria-disabled={currentSlide === images.length - 1}
              className='absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white aria-disabled:opacity-30'
              onPointerDown={handleNextPointerDown}
            >
              ›
            </button>

            <div className='absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-2 py-1 text-xs text-white'>
              {currentSlide + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostImageGallery;
