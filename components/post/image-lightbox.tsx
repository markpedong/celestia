'use client';

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

export function ImageLightbox({ imageUrls, open, index, onClose, altPrefix }: ImageLightboxProps) {
  const slides = imageUrls.map((src, imageIndex) => ({ src, alt: `${altPrefix} ${imageIndex + 1}` }));

  return <Lightbox open={open} close={onClose} index={index} slides={slides} carousel={{ finite: true, preload: imageUrls.length - 1 }} />;
}
