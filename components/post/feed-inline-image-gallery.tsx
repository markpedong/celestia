'use client';

import type { FC } from 'react';
import { Images } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Inline } from 'yet-another-react-lightbox/plugins';
import styles from './feed-inline-image-gallery.module.scss';

const InlineLightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });

type FeedInlineImageGalleryProps = {
  imageUrls: string[];
  title: string;
  index: number;
  onView: (index: number) => void;
  onOpen: (index: number) => void;
};

export const FeedInlineImageGallery: FC<FeedInlineImageGalleryProps> = ({ imageUrls, title, index, onView, onOpen }) => (
  <div className={styles.root}>
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
        className: styles.lightbox,
      }}
    />
    <span className={styles.counter}>
      <Images className='size-3.5' /> {index + 1} / {imageUrls.length}
    </span>
  </div>
);
