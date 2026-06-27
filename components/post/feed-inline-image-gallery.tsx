'use client';

import type { FC } from 'react';
import { Images } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Inline } from 'yet-another-react-lightbox/plugins';

const InlineLightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });

type FeedInlineImageGalleryProps = {
  imageUrls: string[];
  title: string;
  index: number;
  onView: (index: number) => void;
  onOpen: (index: number) => void;
};

export const FeedInlineImageGallery: FC<FeedInlineImageGalleryProps> = ({ imageUrls, title, index, onView, onOpen }) => (
  <div className='relative mt-4 overflow-hidden rounded border border-border/80 bg-muted'>
    <InlineLightbox
      open
      plugins={[Inline]}
      slides={imageUrls.map((src, imageIndex) => ({
        src,
        alt: `Image ${imageIndex + 1} attached to ${title}`,
      }))}
      index={index}
      on={{
        view: ({ index: nextIndex }) => onView(nextIndex),
        click: ({ index: nextIndex }) => onOpen(nextIndex),
      }}
      carousel={{ finite: true, preload: imageUrls.length - 1, imageFit: 'cover' }}
      animation={{ swipe: 300 }}
      controller={{ closeOnBackdropClick: false }}
      toolbar={{ buttons: [] }}
      inline={{
        className: 'aspect-[16/9] w-full md:aspect-[2.35/1]',
      }}
    />
    <span className='pointer-events-none absolute right-3 bottom-3 z-20 inline-flex items-center gap-1 rounded bg-background/90 px-2 py-1 text-xs font-semibold text-foreground shadow-sm'>
      <Images className='size-3.5' /> {index + 1} / {imageUrls.length}
    </span>
  </div>
);
