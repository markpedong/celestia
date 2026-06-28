'use client';

import type { FC } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Images, ZoomIn } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

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
  <div className='size-full' style={{ aspectRatio: ratio }}>
    <div className='flex size-full flex-col items-center justify-center gap-1 bg-muted text-xs text-muted-foreground'>
      <ImageOff className='size-5' />
      Image unavailable
    </div>
  </div>
);

const ZoomOverlay: FC<{ size?: string; className?: string }> = ({ size = 'size-6', className = 'hover:bg-foreground/35' }) => (
  <span className={`absolute inset-0 flex items-center justify-center bg-foreground/0 text-transparent transition-colors ${className} hover:text-background`}>
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
      className='group relative h-20 w-28 shrink-0 self-center overflow-hidden rounded border border-border/80 shadow-inner'
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
            className='object-cover transition-transform duration-200 hover:scale-105'
            loading='eager'
            onError={() => onImageError(imageUrl)}
          />
          <ZoomOverlay size='size-4' />
        </>
      )}
      {imageUrls.length > 1 ? (
        <span className='absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm'>
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
    <div className='relative mt-4 overflow-hidden rounded border border-border/80 bg-muted'>
      <button
        type='button'
        onClick={() => onOpen(activeIndex)}
        disabled={isImageUnavailable(imageUrl)}
        className='group relative aspect-[16/9] w-full text-left md:aspect-[2.35/1]'
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
            className='object-cover transition-transform duration-300 group-hover:scale-[1.015]'
            loading='eager'
            onError={() => onImageError(imageUrl)}
          />
        )}
        {!isImageUnavailable(imageUrl) ? <ZoomOverlay className='hover:bg-foreground/30' /> : null}
      </button>
    </div>
  );
};

export const GalleryImageGallery: FC<ImageGalleryViewProps> = props => {
  const { imageUrls, title, activeIndex, isImageUnavailable, onImageError, onNext, onOpen, onPrevious } = props;

  if (imageUrls.length === 1) {
    const imageUrl = imageUrls[0];

    return (
      <div className='mt-5'>
        <button
          type='button'
          onClick={() => onOpen(0)}
          disabled={isImageUnavailable(imageUrl)}
          className='group relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/80 bg-muted text-left'
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
              className='object-cover transition-transform duration-200 hover:scale-[1.02]'
              loading='eager'
              onError={() => onImageError(imageUrl)}
            />
          )}
          {!isImageUnavailable(imageUrl) ? <ZoomOverlay /> : null}
        </button>
      </div>
    );
  }

  return (
    <div className='relative mt-5 overflow-hidden rounded border border-border/80 bg-muted'>
      <div className='flex transition-transform duration-300 ease-out' style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {imageUrls.map((imageUrl, index) => (
          <button
            key={imageUrl}
            type='button'
            onClick={() => onOpen(index)}
            disabled={isImageUnavailable(imageUrl)}
            className='group relative aspect-[16/9] w-full shrink-0 text-left'
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
                className='object-cover transition-transform duration-200 hover:scale-[1.02]'
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
        className='absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background'
        aria-label='Previous image'
      >
        <ChevronLeft className='size-5' />
      </button>
      <button
        type='button'
        onClick={onNext}
        className='absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background'
        aria-label='Next image'
      >
        <ChevronRight className='size-5' />
      </button>
      <div className='absolute right-3 bottom-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm' aria-live='polite'>
        {activeIndex + 1} / {imageUrls.length}
      </div>
    </div>
  );
};
