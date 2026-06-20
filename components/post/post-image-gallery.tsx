'use client';

import { ChevronLeft, ChevronRight, ImageOff, Images, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { AspectRatio } from '../ui/aspect-ratio';
import { ImageLightbox } from './image-lightbox';

type PostImageGalleryProps = {
  imageUrls: string[];
  title: string;
  variant: 'thumbnail' | 'gallery';
};

const isImageUrl = (url: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

function ImagePlaceholder({ ratio }: { ratio: number }) {
  return (
    <AspectRatio ratio={ratio} className='size-full'>
      <div className='flex size-full flex-col items-center justify-center gap-1 bg-muted text-xs text-muted-foreground'>
        <ImageOff className='size-5' />
        Image unavailable
      </div>
    </AspectRatio>
  );
}

export function PostImageGallery({ imageUrls, title, variant }: PostImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);

  const imageUnavailable = (imageUrl: string) => !isImageUrl(imageUrl) || failedImageUrls.includes(imageUrl);
  const displayImageUrls = variant === 'gallery' ? imageUrls.filter(imageUrl => !imageUnavailable(imageUrl)) : imageUrls;
  if (displayImageUrls.length === 0) {
    return variant === 'thumbnail' ? <div className='h-20 w-28 shrink-0 self-center overflow-hidden rounded-xl border border-border/80 shadow-inner'><ImagePlaceholder ratio={7 / 5} /></div> : null;
  }

  const open = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const showPrevious = () => setActiveIndex(index => (index - 1 + displayImageUrls.length) % displayImageUrls.length);
  const showNext = () => setActiveIndex(index => (index + 1) % displayImageUrls.length);
  const markImageUnavailable = (imageUrl: string) => {
    setFailedImageUrls(urls => urls.includes(imageUrl) ? urls : [...urls, imageUrl]);
    setActiveIndex(0);
  };

  const lightbox = <ImageLightbox imageUrls={displayImageUrls} open={isOpen} onClose={() => setIsOpen(false)} index={activeIndex} altPrefix={`Image attached to ${title}`} />;

  if (variant === 'thumbnail') {
    return (
      <>
        <button
          type='button'
          onClick={() => open(0)}
          disabled={imageUnavailable(displayImageUrls[0])}
          className='group relative h-20 w-28 shrink-0 self-center overflow-hidden rounded-xl border border-border/80 shadow-inner'
          aria-label={`View ${displayImageUrls.length} image${displayImageUrls.length === 1 ? '' : 's'} attached to ${title}`}
        >
          {imageUnavailable(displayImageUrls[0]) ? <ImagePlaceholder ratio={7 / 5} /> : <>
            <Image src={displayImageUrls[0]} alt='' fill unoptimized sizes='112px' className='object-cover transition-transform duration-200 group-hover:scale-105' loading='eager' onError={() => markImageUnavailable(displayImageUrls[0])} />
            <span className='absolute inset-0 flex items-center justify-center bg-foreground/0 text-transparent transition-colors group-hover:bg-foreground/35 group-hover:text-background'>
              <ZoomIn className='size-4' />
            </span>
          </>}
          {displayImageUrls.length > 1 ? (
            <span className='absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm'>
              <Images className='size-3' /> {displayImageUrls.length}
            </span>
          ) : null}
        </button>
        {lightbox}
      </>
    );
  }

  if (displayImageUrls.length === 1) {
    const imageUrl = displayImageUrls[0];

    return (
      <>
        <div className='mt-5'>
          <button
            type='button'
            onClick={() => open(0)}
            disabled={imageUnavailable(imageUrl)}
            className='group relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/80 bg-muted text-left'
            aria-label={`View image attached to ${title}`}
          >
            {imageUnavailable(imageUrl) ? <ImagePlaceholder ratio={16 / 9} /> : <Image
              src={imageUrl}
              alt={`Image attached to ${title}`}
              fill
              unoptimized
              sizes='(max-width: 768px) calc(100vw - 8rem), 672px'
              className='object-cover transition-transform duration-200 group-hover:scale-[1.02]'
              onError={() => markImageUnavailable(imageUrl)}
            />}
            {!imageUnavailable(imageUrl) ? <span className='absolute inset-0 flex items-center justify-center bg-foreground/0 text-transparent transition-colors group-hover:bg-foreground/35 group-hover:text-background'>
              <ZoomIn className='size-6' />
            </span> : null}
          </button>
        </div>
        {lightbox}
      </>
    );
  }

  return (
    <>
      <div className='relative mt-5 overflow-hidden rounded-2xl border border-border/80 bg-muted'>
        <div className='flex transition-transform duration-300 ease-out' style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {displayImageUrls.map((imageUrl, index) => (
            <button
              key={imageUrl}
              type='button'
              onClick={() => open(index)}
              disabled={imageUnavailable(imageUrl)}
              className='group relative aspect-[16/9] w-full shrink-0 text-left'
              aria-label={`View image ${index + 1} of ${displayImageUrls.length} attached to ${title}`}
            >
              {imageUnavailable(imageUrl) ? <ImagePlaceholder ratio={16 / 9} /> : <Image
                src={imageUrl}
                alt={`Image ${index + 1} attached to ${title}`}
                fill
                unoptimized
                sizes='(max-width: 768px) calc(100vw - 8rem), 672px'
                className='object-cover transition-transform duration-200 group-hover:scale-[1.02]'
                onError={() => markImageUnavailable(imageUrl)}
              />}
              {!imageUnavailable(imageUrl) ? <span className='absolute inset-0 flex items-center justify-center bg-foreground/0 text-transparent transition-colors group-hover:bg-foreground/35 group-hover:text-background'>
                <ZoomIn className='size-6' />
              </span> : null}
            </button>
          ))}
        </div>
        <button type='button' onClick={showPrevious} className='absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-background/90 p-2 text-foreground shadow-sm transition-colors hover:bg-background' aria-label='Previous image'>
          <ChevronLeft className='size-5' />
        </button>
        <button type='button' onClick={showNext} className='absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-background/90 p-2 text-foreground shadow-sm transition-colors hover:bg-background' aria-label='Next image'>
          <ChevronRight className='size-5' />
        </button>
        <div className='absolute right-3 bottom-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm' aria-live='polite'>
          {activeIndex + 1} / {displayImageUrls.length}
        </div>
      </div>
      {lightbox}
    </>
  );
}
