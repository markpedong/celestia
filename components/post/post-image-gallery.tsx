'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { PostImageGalleryProps } from '@/lib/types';
import { useKeenSlider } from 'keen-slider/react';

import 'keen-slider/keen-slider.min.css';

export const PostImageGallery: FC<PostImageGalleryProps> = ({ imageUrls }) => {
  const images = imageUrls ?? [];
  const [currentSlide, setCurrentSlide] = useState(0);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    loop: false,
    mode: 'snap',
    slides: {
      perView: 1,
      spacing: 0,
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  if (!images.length) return null;

  const goTo = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, images.length - 1));

    setCurrentSlide(safeIndex);
    instanceRef.current?.moveToIdx(safeIndex);
  };

  return (
    <div className='mt-5 w-full min-w-0 overflow-hidden'>
      <div className='relative w-full overflow-hidden rounded-lg'>
        <div ref={sliderRef} className='keen-slider aspect-[3/2] w-full bg-muted'>
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className='keen-slider__slide'>
              <img src={url} alt='' className='h-full w-full object-cover' draggable={false} />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type='button'
              disabled={currentSlide === 0}
              className='absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white disabled:opacity-30'
              onClick={() => goTo(currentSlide - 1)}
            >
              ‹
            </button>

            <button
              type='button'
              disabled={currentSlide === images.length - 1}
              className='absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white disabled:opacity-30'
              onClick={() => goTo(currentSlide + 1)}
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
