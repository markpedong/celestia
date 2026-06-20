'use client';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { ImagePlus, Trash2, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  initialImageUrl?: string;
};

export function ImageUploadField({ initialImageUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl ?? '');
  const [imageName, setImageName] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const slides = useMemo(() => previewUrl ? [{ src: previewUrl, alt: 'Post image preview' }] : [], [previewUrl]);

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectImage = (file: File | undefined) => {
    if (!file) return;
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setImageName(file.name);
    setRemoveImage(false);
  };

  const clearImage = () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setImageName(null);
    setRemoveImage(true);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className='space-y-3'>
      <input ref={inputRef} id='image' name='image' type='file' accept='image/png,image/jpeg,image/webp,image/gif' className='sr-only' onChange={event => selectImage(event.target.files?.[0])} />
      <input type='hidden' name='removeImage' value={removeImage ? 'true' : 'false'} />
      {previewUrl ? (
        <div className='relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted'>
          <Image src={previewUrl} alt='Selected post image preview' fill unoptimized sizes='(max-width: 768px) 100vw, 672px' className='object-contain' />
          <div className='absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-background/90 to-transparent p-3'>
            <button type='button' onClick={() => setIsLightboxOpen(true)} className='inline-flex items-center gap-1.5 rounded-lg bg-card/95 px-2.5 py-1.5 text-xs font-medium shadow-sm hover:bg-card'>
              <ZoomIn className='size-3.5' /> Preview
            </button>
            <button type='button' onClick={clearImage} className='inline-flex items-center gap-1.5 rounded-lg bg-destructive px-2.5 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90'>
              <Trash2 className='size-3.5' /> Remove
            </button>
          </div>
        </div>
      ) : null}
      <button type='button' onClick={() => inputRef.current?.click()} className='flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/60 px-3 py-3 text-sm text-muted-foreground celestia-hover-surface'>
        <ImagePlus className='size-4 text-primary' />
        <span className='truncate'>{imageName ?? 'Add image'}</span>
      </button>
      <p className='text-xs text-muted-foreground'>PNG, JPEG, WebP, or GIF · maximum 2 MB</p>
      <Lightbox open={isLightboxOpen} close={() => setIsLightboxOpen(false)} slides={slides} carousel={{ finite: true }} />
    </div>
  );
}
