'use client';

import type { FC } from 'react';
import { ImagePlus, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { ACCEPTED_IMAGE_TYPES, IMAGE_ACCEPT, MAX_IMAGE_BYTES, MAX_POST_IMAGES } from '@/constants';
import type { ImageUploadFieldProps } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { ImageLightbox } from './image-lightbox';

export const ImageUploadField: FC<ImageUploadFieldProps> = ({
  initialImageUrls = [],
  name = 'image',
  multiple = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState(initialImageUrls);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [removeImages, setRemoveImages] = useState(false);

  useEffect(() => () => {
    previewUrls.forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
  }, [previewUrls]);

  const selectImages = (files: FileList | null) => {
    const selected = Array.from(files ?? []).slice(0, multiple ? MAX_POST_IMAGES : 1);
    if (selected.length === 0) return;

    const invalidFile = selected.find(file => !ACCEPTED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalidFile) {
      inputRef.current?.setCustomValidity('Use PNG, JPEG, WebP, or GIF images that are 2 MB or smaller.');
      inputRef.current?.reportValidity();
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    inputRef.current?.setCustomValidity('');

    const transfer = new DataTransfer();
    selected.forEach(file => transfer.items.add(file));
    if (inputRef.current) inputRef.current.files = transfer.files;
    setPreviewUrls(selected.map(file => URL.createObjectURL(file)));
    setImageNames(selected.map(file => file.name));
    setRemoveImages(false);
    setActiveIndex(0);
  };

  const removeImage = (index: number) => {
    const url = previewUrls[index];
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);

    const transfer = new DataTransfer();
    Array.from(inputRef.current?.files ?? []).forEach((file, fileIndex) => {
      if (fileIndex !== index) transfer.items.add(file);
    });
    if (inputRef.current) inputRef.current.files = transfer.files;

    const remaining = previewUrls.length - 1;
    setPreviewUrls(urls => urls.filter((_, imageIndex) => imageIndex !== index));
    setImageNames(names => names.filter((_, imageIndex) => imageIndex !== index));
    setRemoveImages(remaining === 0 && initialImageUrls.length > 0);
    setActiveIndex(current => Math.min(current, Math.max(remaining - 1, 0)));
  };
  const clearImages = () => {
    previewUrls.forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    if (inputRef.current) inputRef.current.value = '';
    setPreviewUrls([]);
    setImageNames([]);
    setRemoveImages(initialImageUrls.length > 0);
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
        name={name}
        type='file'
        accept={IMAGE_ACCEPT}
        multiple={multiple}
        className='sr-only'
        onChange={event => selectImages(event.target.files)}
      />
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
            clearImages();
            inputRef.current?.click();
          }}
          className='flex min-w-0 flex-1 items-center justify-center gap-2 rounded border border-dashed border-border bg-secondary/60 px-3 py-3 text-sm text-muted-foreground celestia-hover-surface'
        >
          <ImagePlus className='size-4 text-primary' />
          <span className='truncate'>
            {imageNames.length > 0
              ? `${imageNames.length} image${imageNames.length === 1 ? '' : 's'} selected`
              : multiple
                ? 'Add images'
                : 'Add image'}
          </span>
        </button>
        <button
          type='button'
          onClick={clearImages}
          disabled={previewUrls.length === 0}
          className='inline-flex size-11 shrink-0 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50'
          aria-label='Remove selected images'
        >
          <X className='size-4' />
        </button>
      </div>
      <p className='text-xs text-muted-foreground'>
        PNG, JPEG, WebP, or GIF · maximum 2 MB each{multiple ? ` · up to ${MAX_POST_IMAGES} images` : ''}
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
