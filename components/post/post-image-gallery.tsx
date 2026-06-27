'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { ImageLightbox } from './image-lightbox';
import { FeedImageGallery, GalleryImageGallery, ThumbnailImageGallery, isImageUrl } from './post-image-gallery-views';
import { PostImageGalleryProps } from '@/lib/types';

export const PostImageGallery: FC<PostImageGalleryProps> = ({ imageUrls, title, variant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);

  const isImageUnavailable = (imageUrl: string) => !isImageUrl(imageUrl) || failedImageUrls.includes(imageUrl);
  const displayImageUrls =
    variant === 'gallery' ? imageUrls.filter(imageUrl => !isImageUnavailable(imageUrl)) : imageUrls;

  if (displayImageUrls.length === 0) return null;

  const open = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const markImageUnavailable = (imageUrl: string) => {
    setFailedImageUrls(urls => (urls.includes(imageUrl) ? urls : [...urls, imageUrl]));
    setActiveIndex(0);
  };

  const viewProps = {
    imageUrls: displayImageUrls,
    title,
    activeIndex,
    isImageUnavailable,
    onImageError: markImageUnavailable,
    onOpen: open,
    onNext: () => setActiveIndex(index => (index + 1) % displayImageUrls.length),
    onPrevious: () => setActiveIndex(index => (index - 1 + displayImageUrls.length) % displayImageUrls.length),
    onView: setActiveIndex,
  };

  return (
    <>
      {variant === 'thumbnail' ? <ThumbnailImageGallery {...viewProps} /> : null}
      {variant === 'feed' ? <FeedImageGallery {...viewProps} /> : null}
      {variant === 'gallery' ? <GalleryImageGallery {...viewProps} /> : null}
      <ImageLightbox
        imageUrls={displayImageUrls}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        index={activeIndex}
        altPrefix={`Image attached to ${title}`}
      />
    </>
  );
};
