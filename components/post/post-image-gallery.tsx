'use client';

import Image from 'next/image';
import type { PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import classNames from 'classnames';
import styles from './post-image-gallery.module.scss';

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
    <div className={styles.root}>
      <div className={styles.frame}>
        <div
          ref={sliderRef}
          className={classNames('keen-slider', styles.slider, {
            [styles.ready]: ready,
          })}
        >
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className={classNames('keen-slider__slide', styles.slide)}>
              <Image
                src={url}
                alt=''
                fill
                unoptimized
                sizes='(max-width: 768px) calc(100vw - 5rem), 760px'
                className={styles.image}
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
              className={classNames(styles.nav, styles.previous)}
              onPointerDown={handlePreviousPointerDown}
              aria-label='Previous image'
            >
              <ChevronLeft className={styles.navIcon} />
            </button>

            <button
              type='button'
              aria-disabled={currentSlide === images.length - 1}
              className={classNames(styles.nav, styles.next)}
              onPointerDown={handleNextPointerDown}
              aria-label='Next image'
            >
              <ChevronRight className={styles.navIcon} />
            </button>

            <div className={styles.counter}>
              {currentSlide + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostImageGallery;
