'use client';

import type { FC } from 'react';
import { ImagePlus, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { ACCEPTED_IMAGE_TYPES, IMAGE_ACCEPT, MAX_IMAGE_BYTES, MAX_POST_IMAGES } from '@/constants';
import type { ImageUploadFieldProps } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { ImageLightbox } from './image-lightbox';
import { useUploadImages } from '@/hooks/useQueries';

type ImageItem = {
  id: string;
  imageUrl: string;
  previewUrl: string;
  name?: string;
  initial: boolean;
};

export const ImageUploadField: FC<ImageUploadFieldProps> = ({
  initialImageUrls = [],
  name = 'image',
  multiple = false,
  onUploadingChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImages = useUploadImages();
  const [items, setItems] = useState<ImageItem[]>(() =>
    initialImageUrls.map(imageUrl => ({ id: imageUrl, imageUrl, previewUrl: imageUrl, initial: true }))
  );
  const itemsRef = useRef(items);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const imageUrls = items.map(item => item.imageUrl);
  const previewUrls = items.map(item => item.previewUrl);
  const imageNames = items.flatMap(item => (item.name ? [item.name] : []));
  const removeImages = initialImageUrls.length > 0 && !items.some(item => item.initial);

  useEffect(() => {
    onUploadingChange?.(uploadImages.isPending);
  }, [onUploadingChange, uploadImages.isPending]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    itemsRef.current.forEach(item => {
      if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    });
  }, []);

  const selectImages = async (files: FileList | null) => {
    const availableSlots = multiple ? MAX_POST_IMAGES - items.length : 1;
    const selected = Array.from(files ?? []).slice(0, Math.max(availableSlots, 0));
    if (selected.length === 0) return;

    const invalidFile = selected.find(file => !ACCEPTED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalidFile) {
      inputRef.current?.setCustomValidity('Use PNG, JPEG, WebP, or GIF images that are 2 MB or smaller.');
      inputRef.current?.reportValidity();
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    inputRef.current?.setCustomValidity('');

    const selectedPreviews = selected.map(file => URL.createObjectURL(file));

    try {
      const uploadedUrls = await uploadImages.mutateAsync({ files: selected });
      setItems(current => {
        const nextItems = uploadedUrls.map((imageUrl, index) => ({
          id: `${imageUrl}-${crypto.randomUUID()}`,
          imageUrl,
          previewUrl: selectedPreviews[index] ?? imageUrl,
          name: selected[index]?.name,
          initial: false,
        }));

        if (!multiple) {
          current.forEach(item => {
            if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
          });
          return nextItems.slice(0, 1);
        }

        return [...current, ...nextItems].slice(0, MAX_POST_IMAGES);
      });
      setActiveIndex(0);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      if (inputRef.current) inputRef.current.value = '';
      selectedPreviews.forEach(url => URL.revokeObjectURL(url));
    }
  };

  const removeImage = (index: number) => {
    setItems(current => {
      const item = current[index];
      if (item?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
    const remaining = items.length - 1;
    setActiveIndex(current => Math.min(current, Math.max(remaining - 1, 0)));
  };
  const clearImages = () => {
    items.forEach(item => {
      if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    });
    if (inputRef.current) inputRef.current.value = '';
    setItems([]);
    setActiveIndex(0);
  };

  const openPreview = (index: number) => {
    setActiveIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <div className='space-y-3'>
      <input
        ref={inputRef}
        id={name}
        type='file'
        accept={IMAGE_ACCEPT}
        multiple={multiple}
        className='sr-only'
        onChange={event => selectImages(event.target.files)}
      />
      <input type='hidden' name={name} value={JSON.stringify(imageUrls)} />
      <input type='hidden' name='removeImages' value={removeImages ? 'true' : 'false'} />

      {previewUrls.length > 0 ? (
        <div className={`grid gap-2 ${previewUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {previewUrls.map((previewUrl, index) => (
            <div key={previewUrl} className='group relative aspect-[16/9] overflow-hidden rounded border border-border bg-muted'>
              <button type='button' onClick={() => openPreview(index)} className='absolute inset-0 text-left' aria-label={`Preview image ${index + 1}`}>
                <Image
                  src={previewUrl}
                  alt={`Selected post image preview ${index + 1}`}
                  fill
                  unoptimized
                  sizes='(max-width: 768px) 100vw, 336px'
                  className='object-cover transition-transform duration-200 hover:scale-[1.02]'
                />
                <span className='absolute inset-0 flex items-center justify-center bg-foreground/0 text-transparent transition-colors hover:bg-foreground/35 hover:text-background'>
                  <ZoomIn className='size-5' />
                </span>
              </button>
              <button type='button' onClick={() => removeImage(index)} className='absolute top-2 right-2 z-10 rounded-full bg-background/90 p-1 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground' aria-label={`Remove image ${index + 1}`}>
                <X className='size-4' />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className='flex gap-2'>
        <button
          type='button'
          onClick={() => {
            inputRef.current?.click();
          }}
          disabled={uploadImages.isPending || (multiple && items.length >= MAX_POST_IMAGES)}
          className='flex min-w-0 flex-1 items-center justify-center gap-2 rounded border border-dashed border-border bg-secondary/60 px-3 py-3 text-sm text-muted-foreground celestia-hover-surface'
        >
          <ImagePlus className='size-4 text-primary' />
          <span className='truncate'>
            {imageNames.length > 0
              ? `${imageNames.length} image${imageNames.length === 1 ? '' : 's'} selected`
              : items.length > 0
                ? `${items.length} image${items.length === 1 ? '' : 's'} selected`
              : multiple
                ? items.length >= MAX_POST_IMAGES
                  ? 'Maximum images selected'
                  : 'Add images'
                : 'Add image'}
          </span>
        </button>
        {previewUrls.length > 0 ? (
          <button
            type='button'
            onClick={clearImages}
            className='inline-flex size-11 shrink-0 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
            aria-label='Remove selected images'
          >
            <X className='size-4' />
          </button>
        ) : null}
      </div>
      <p className='text-xs text-muted-foreground'>
        {uploadImages.isPending ? 'Optimizing images...' : `PNG, JPEG, WebP, or GIF · maximum 2 MB each${multiple ? ` · up to ${MAX_POST_IMAGES} images` : ''}`}
      </p>
      <ImageLightbox
        imageUrls={previewUrls}
        open={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        index={activeIndex}
        altPrefix='Post image preview'
      />
    </div>
  );
};
