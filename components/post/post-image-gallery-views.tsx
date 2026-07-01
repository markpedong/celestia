'use client';

import type { FC } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Images, ZoomIn } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import classNames from 'classnames';
import styles from './post-image-gallery-views.module.scss';

const FeedInlineImageGallery = dynamic(() =>
  import('./feed-inline-image-gallery').then(module => module.FeedInlineImageGallery)
);

type ImageGalleryViewProps = {
  imageUrls: string[];
  title: string;
  activeIndex: number;
  isImageUnavailable: (imageUrl: string) => boolean;
  onImageError: (imageUrl: string) => void;
  onOpen: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onView: (index: number) => void;
};

export const isImageUrl = (url: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

const ImagePlaceholder: FC<{ ratio: number }> = ({ ratio }) => (
  <div className={styles.placeholder} style={{ aspectRatio: ratio }}>
    <ImageOff className='size-5' />
    Image unavailable
  </div>
);

const ZoomOverlay: FC<{ size?: string; className?: string }> = ({ size = 'size-6', className }) => (
  <span className={classNames(styles.zoomOverlay, className)}>
    <ZoomIn className={size} />
  </span>
);

export const ThumbnailImageGallery: FC<ImageGalleryViewProps> = ({ imageUrls, title, isImageUnavailable, onImageError, onOpen }) => {
  const imageUrl = imageUrls[0];

  return (
    <button
      type='button'
      onClick={() => onOpen(0)}
      disabled={isImageUnavailable(imageUrl)}
      className={classNames('group', styles.thumbnail)}
      aria-label={`View ${imageUrls.length} image${imageUrls.length === 1 ? '' : 's'} attached to ${title}`}
    >
      {isImageUnavailable(imageUrl) ? (
        <ImagePlaceholder ratio={7 / 5} />
      ) : (
        <>
          <Image
            src={imageUrl}
            alt=''
            fill
            unoptimized
            sizes='112px'
            className={styles.thumbnailImage}
            loading='eager'
            onError={() => onImageError(imageUrl)}
          />
          <ZoomOverlay size='size-4' />
        </>
      )}
      {imageUrls.length > 1 ? (
        <span className={styles.countBadge}>
          <Images className='size-3' /> {imageUrls.length}
        </span>
      ) : null}
    </button>
  );
};

export const FeedImageGallery: FC<ImageGalleryViewProps> = props => {
  const { imageUrls, title, activeIndex, isImageUnavailable, onImageError, onOpen, onView } = props;
  const imageUrl = imageUrls[activeIndex] ?? imageUrls[0];

  if (imageUrls.length > 1) {
    return <FeedInlineImageGallery imageUrls={imageUrls} title={title} index={activeIndex} onView={onView} onOpen={onOpen} />;
  }

  return (
    <button
      type='button'
      onClick={() => onOpen(activeIndex)}
      disabled={isImageUnavailable(imageUrl)}
      className={classNames('group', styles.feedButton)}
      aria-label={`View image ${activeIndex + 1} of ${imageUrls.length} attached to ${title}`}
    >
      {isImageUnavailable(imageUrl) ? (
        <ImagePlaceholder ratio={16 / 9} />
      ) : (
        <Image
          src={imageUrl}
          alt={`Image attached to ${title}`}
          fill
          unoptimized
          sizes='(max-width: 768px) calc(100vw - 5rem), 760px'
          className={styles.feedImage}
          loading='eager'
          onError={() => onImageError(imageUrl)}
        />
      )}
      {!isImageUnavailable(imageUrl) ? <ZoomOverlay className={styles.zoomOverlaySubtle} /> : null}
    </button>
  );
};

export const GalleryImageGallery: FC<ImageGalleryViewProps> = props => {
  const { imageUrls, title, activeIndex, isImageUnavailable, onImageError, onNext, onOpen, onPrevious } = props;

  if (imageUrls.length === 1) {
    const imageUrl = imageUrls[0];

    return (
      <button
        type='button'
        onClick={() => onOpen(0)}
        disabled={isImageUnavailable(imageUrl)}
        className={classNames('group', styles.singleButton)}
        aria-label={`View image attached to ${title}`}
      >
        {isImageUnavailable(imageUrl) ? (
          <ImagePlaceholder ratio={16 / 9} />
        ) : (
          <Image
            src={imageUrl}
            alt={`Image attached to ${title}`}
            fill
            unoptimized
            sizes='(max-width: 768px) calc(100vw - 8rem), 672px'
            className={styles.galleryImage}
            loading='eager'
            onError={() => onImageError(imageUrl)}
          />
        )}
        {!isImageUnavailable(imageUrl) ? <ZoomOverlay /> : null}
      </button>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.track} style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {imageUrls.map((imageUrl, index) => (
          <button
            key={imageUrl}
            type='button'
            onClick={() => onOpen(index)}
            disabled={isImageUnavailable(imageUrl)}
            className={classNames('group', styles.slide)}
            aria-label={`View image ${index + 1} of ${imageUrls.length} attached to ${title}`}
          >
            {isImageUnavailable(imageUrl) ? (
              <ImagePlaceholder ratio={16 / 9} />
            ) : (
              <Image
                src={imageUrl}
                alt={`Image ${index + 1} attached to ${title}`}
                fill
                unoptimized
                sizes='(max-width: 768px) calc(100vw - 8rem), 672px'
                className={styles.galleryImage}
                loading={index === 0 ? 'eager' : 'lazy'}
                onError={() => onImageError(imageUrl)}
              />
            )}
            {!isImageUnavailable(imageUrl) ? <ZoomOverlay /> : null}
          </button>
        ))}
      </div>
      <button
        type='button'
        onClick={onPrevious}
        className={classNames(styles.nav, styles.previous)}
        aria-label='Previous image'
      >
        <ChevronLeft className='size-5' />
      </button>
      <button
        type='button'
        onClick={onNext}
        className={classNames(styles.nav, styles.next)}
        aria-label='Next image'
      >
        <ChevronRight className='size-5' />
      </button>
      <div className={styles.counter} aria-live='polite'>
        {activeIndex + 1} / {imageUrls.length}
      </div>
    </div>
  );
};
