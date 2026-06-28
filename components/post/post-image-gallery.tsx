'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { PostImageGalleryProps } from '@/lib/types';
import { useKeenSlider } from 'keen-slider/react';

import 'keen-slider/keen-slider.min.css';

export const PostImageGallery: FC<PostImageGalleryProps> = ({ imageUrls }) => {
  const images = imageUrls ?? [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const targetSlideRef = useRef(0);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    loop: false,
    mode: 'snap',
    defaultAnimation: {
      duration: 280,
    },
    slides: {
      perView: 1,
      spacing: 0,
    },
    slideChanged(slider) {
      const nextSlide = slider.track.details.rel;

      if (!slider.animator.active) {
        targetSlideRef.current = nextSlide;
        setCurrentSlide(nextSlide);
      }
    },
    animationEnded(slider) {
      const nextSlide = slider.track.details.rel;
      targetSlideRef.current = nextSlide;
      setCurrentSlide(nextSlide);
    },
    dragEnded(slider) {
      const nextSlide = slider.track.details.rel;
      targetSlideRef.current = nextSlide;
      setCurrentSlide(nextSlide);
    },
  });

  if (!images.length) return null;

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === images.length - 1;

  const goBy = (delta: -1 | 1) => {
    const safeIndex = Math.max(0, Math.min(targetSlideRef.current + delta, images.length - 1));
    const slider = instanceRef.current;

    if (safeIndex === targetSlideRef.current) return;

    targetSlideRef.current = safeIndex;
    setCurrentSlide(safeIndex);

    if (!slider) return;

    slider.animator.stop();
    slider.moveToIdx(safeIndex, true, { duration: 280 });
  };

  return (
    <div className='mt-5 w-full min-w-0 overflow-hidden'>
      <div className='relative w-full overflow-hidden rounded-lg'>
        <div ref={sliderRef} className='keen-slider aspect-[3/2] w-full bg-muted'>
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
              aria-disabled={isFirstSlide}
              className='absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white aria-disabled:opacity-30'
              onPointerDown={event => {
                event.preventDefault();
                event.stopPropagation();
                goBy(-1);
              }}
            >
              ‹
            </button>

            <button
              type='button'
              aria-disabled={isLastSlide}
              className='absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white aria-disabled:opacity-30'
              onPointerDown={event => {
                event.preventDefault();
                event.stopPropagation();
                goBy(1);
              }}
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
