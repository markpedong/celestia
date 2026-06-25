'use client';

import { cn } from '@/lib/utils';
import { ImagePlus, RotateCcw, Trash2, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

type ImageUploaderProps = {
  acceptedFileTypes: string[];
  aspectRatio?: number;
  className?: string;
  disabled?: boolean;
  initialImageUrl?: string | null;
  maxSize: number;
  outputHeight?: number;
  outputWidth?: number;
  previewLabel: string;
  onClear?: () => void;
  onImageCropped: (file: File) => void;
};

const loadImage = async (src: string) => {
  const image = new window.Image();
  image.src = src;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to load image preview.'));
  });
  return image;
};

const cropImage = async (
  imageSrc: string,
  cropArea: Area,
  file: File,
  outputWidth?: number,
  outputHeight?: number,
) => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth ?? Math.round(cropArea.width);
  canvas.height = outputHeight ?? Math.round(cropArea.height);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to crop this image.');

  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const type = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => (result ? resolve(result) : reject(new Error('Unable to crop this image.'))), type, 0.92);
  });

  const extension = type.split('/')[1] ?? 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}-cropped.${extension}`, { type });
};

export function ImageUploader({
  acceptedFileTypes,
  aspectRatio = 1,
  className,
  disabled,
  initialImageUrl,
  maxSize,
  outputHeight,
  outputWidth,
  previewLabel,
  onClear,
  onImageCropped,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(initialImageUrl ?? null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  useEffect(
    () => () => {
      if (image?.startsWith('blob:')) URL.revokeObjectURL(image);
      if (previewImage?.startsWith('blob:')) URL.revokeObjectURL(previewImage);
    },
    [image, previewImage],
  );

  const resetCropState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const selectFile = (file: File | null) => {
    if (!file) return;
    setError(null);

    if (!acceptedFileTypes.includes(file.type)) {
      setError(`Use one of these image types: ${acceptedFileTypes.map(type => type.replace('image/', '.')).join(', ')}`);
      return;
    }

    if (file.size > maxSize) {
      setError(`Use an image ${maxSize / (1024 * 1024)} MB or smaller.`);
      return;
    }

    if (image?.startsWith('blob:')) URL.revokeObjectURL(image);
    const url = URL.createObjectURL(file);
    setImage(url);
    setSourceFile(file);
    resetCropState();
    setIsCropDialogOpen(true);
  };

  const onCropComplete = useCallback((_: Area, area: Area) => {
    setCroppedAreaPixels(area);
  }, []);

  const applyCrop = async () => {
    if (!image || !sourceFile || !croppedAreaPixels) return;

    try {
      const croppedFile = await cropImage(image, croppedAreaPixels, sourceFile, outputWidth, outputHeight);
      const previewUrl = URL.createObjectURL(croppedFile);
      setPreviewImage(current => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
        return previewUrl;
      });
      onImageCropped(croppedFile);
      setIsCropDialogOpen(false);
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : 'Unable to crop this image.');
    }
  };

  const clearImage = () => {
    if (inputRef.current) inputRef.current.value = '';
    if (image?.startsWith('blob:')) URL.revokeObjectURL(image);
    if (previewImage?.startsWith('blob:')) URL.revokeObjectURL(previewImage);
    setImage(null);
    setPreviewImage(null);
    setSourceFile(null);
    setError(null);
    resetCropState();
    onClear?.();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    selectFile(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {previewImage ? (
        <div className='relative overflow-hidden rounded border border-border bg-muted' style={{ aspectRatio }}>
          <Image
            src={previewImage}
            alt={`${previewLabel} preview`}
            fill
            unoptimized
            sizes='(max-width: 768px) calc(100vw - 2rem), 640px'
            className='object-cover'
          />
          <div className='absolute right-3 bottom-3 flex gap-2'>
            {image ? (
              <Button type='button' size='sm' onClick={() => setIsCropDialogOpen(true)} disabled={disabled}>
                <RotateCcw /> Edit
              </Button>
            ) : null}
            <Button
              type='button'
              variant='outline'
              size='icon-sm'
              onClick={clearImage}
              disabled={disabled}
              aria-label={`Remove ${previewLabel}`}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role='button'
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
          onDragOver={event => event.preventDefault()}
          onDragEnter={event => event.preventDefault()}
          onDragLeave={event => event.preventDefault()}
          onDrop={handleDrop}
          className='cursor-pointer rounded border-2 border-dashed border-border bg-secondary/50 p-6 text-center transition-colors hover:bg-muted/30'
        >
          <Upload className='mx-auto size-8 text-primary' />
          <p className='mt-2 text-sm font-medium text-foreground'>Drag and drop or click to browse</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            {acceptedFileTypes.map(type => type.replace('image/', '.')).join(', ')} · max {maxSize / (1024 * 1024)} MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type='file'
        accept={acceptedFileTypes.join(',')}
        className='sr-only'
        disabled={disabled}
        onChange={event => selectFile(event.target.files?.[0] ?? null)}
      />
      {!previewImage ? (
        <Button type='button' variant='outline' className='w-full' onClick={() => inputRef.current?.click()} disabled={disabled}>
          <ImagePlus /> Choose image
        </Button>
      ) : null}
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Crop image</DialogTitle>
            <DialogDescription>Drag the image to position it, then adjust zoom.</DialogDescription>
          </DialogHeader>
          {image ? (
            <>
              <div className='relative h-80 overflow-hidden rounded border border-border bg-muted'>
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className='flex items-center gap-3'>
                <ZoomOut className='size-4 text-muted-foreground' />
                <input
                  type='range'
                  min='1'
                  max='3'
                  step='0.1'
                  value={zoom}
                  onChange={event => setZoom(Number(event.target.value))}
                  className='w-full'
                  aria-label='Zoom image'
                />
                <ZoomIn className='size-4 text-muted-foreground' />
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setIsCropDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type='button' onClick={applyCrop}>
                  Apply crop
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
