'use client';

import type { FC } from 'react';
import dynamic from 'next/dynamic';
import 'yet-another-react-lightbox/styles.css';

const Lightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });

type ImageLightboxProps = {
  imageUrls: string[];
  open: boolean;
  index: number;
  onClose: () => void;
  altPrefix: string;
};

export const ImageLightbox: FC<ImageLightboxProps> = ({ imageUrls, open, index, onClose, altPrefix }) => {
  const slides = imageUrls.map((src, imageIndex) => ({ src, alt: `${altPrefix} ${imageIndex + 1}` }));
  const safeIndex = Math.min(Math.max(index, 0), Math.max(slides.length - 1, 0));

  return <Lightbox key={`${safeIndex}-${slides.length}`} open={open} close={onClose} index={safeIndex} slides={slides} carousel={{ finite: true, preload: imageUrls.length - 1 }} />;
};
