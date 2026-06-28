'use client';

import type { FC } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { ImageLightbox } from './image-lightbox';
import { PostImageGalleryProps } from '@/lib/types';

const isImageUrl = (url: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

const ImagePlaceholder: FC<{ ratio: number }> = ({ ratio }) => {
  return (
    <div className='size-full' style={{ aspectRatio: ratio }}>
      <div className='flex size-full flex-col items-center justify-center gap-1 bg-muted text-xs text-muted-foreground'>
        <ImageOff className='size-5' />
        Image unavailable
      </div>
    </div>
  );
};

export const PostImageGallery: FC<PostImageGalleryProps> = ({ imageUrls, title, variant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);

  const imageUnavailable = (imageUrl: string) => !isImageUrl(imageUrl) || failedImageUrls.includes(imageUrl);
  const displayImageUrls =
    variant === 'gallery' ? imageUrls.filter(imageUrl => !imageUnavailable(imageUrl)) : imageUrls;

  if (displayImageUrls.length === 0) {
    return null;
  }

  const open = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const showPrevious = () => setActiveIndex(index => (index - 1 + displayImageUrls.length) % displayImageUrls.length);
  const showNext = () => setActiveIndex(index => (index + 1) % displayImageUrls.length);
  const markImageUnavailable = (imageUrl: string) => {
    setFailedImageUrls(urls => (urls.includes(imageUrl) ? urls : [...urls, imageUrl]));
    setActiveIndex(0);
  };

  const lightbox = (
    <ImageLightbox
      imageUrls={displayImageUrls}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      index={activeIndex}
      altPrefix={`Image attached to ${title}`}
    />
  );
  const activeImageUrl = displayImageUrls[activeIndex] ?? displayImageUrls[0];

  return (
    <>
      <div className='relative mt-5 overflow-hidden rounded border border-border/80 bg-muted'>
        <button
          type='button'
          onClick={() => open(activeIndex)}
          disabled={imageUnavailable(activeImageUrl)}
          className='group relative aspect-[16/9] w-full text-left'
          aria-label={`View image ${activeIndex + 1} of ${displayImageUrls.length} attached to ${title}`}
        >
          {imageUnavailable(activeImageUrl) ? (
            <ImagePlaceholder ratio={16 / 9} />
          ) : (
            <Image
              src={activeImageUrl}
              alt={`Image ${activeIndex + 1} attached to ${title}`}
              fill
              unoptimized
              sizes='(max-width: 768px) calc(100vw - 8rem), 672px'
              className='object-cover transition-transform duration-200 hover:scale-[1.02]'
              priority={activeIndex === 0}
              onError={() => markImageUnavailable(activeImageUrl)}
            />
          )}
          {!imageUnavailable(activeImageUrl) ? (
            <span className='absolute inset-0 flex items-center justify-center bg-foreground/0 text-transparent transition-colors hover:bg-foreground/35 hover:text-background'>
              <ZoomIn className='size-6' />
            </span>
          ) : null}
        </button>
        <button
          type='button'
          onClick={event => {
            event.stopPropagation();
            showPrevious();
          }}
          className='absolute top-1/2 left-3 z-20 -translate-y-1/2 rounded-full bg-background/90 p-2 text-foreground shadow-sm transition-colors hover:bg-background'
          aria-label='Previous image'
        >
          <ChevronLeft className='size-5' />
        </button>
        <button
          type='button'
          onClick={event => {
            event.stopPropagation();
            showNext();
          }}
          className='absolute top-1/2 right-3 z-20 -translate-y-1/2 rounded-full bg-background/90 p-2 text-foreground shadow-sm transition-colors hover:bg-background'
          aria-label='Next image'
        >
          <ChevronRight className='size-5' />
        </button>
        <div
          className='absolute right-3 bottom-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm'
          aria-live='polite'
        >
          {activeIndex + 1} / {displayImageUrls.length}
        </div>
      </div>
      {lightbox}
    </>
  );
};
