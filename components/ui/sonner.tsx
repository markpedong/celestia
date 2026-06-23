'use client';

import { Toaster as Sonner } from 'sonner';
import { useEffect, useState } from 'react';

export const Toaster = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <Sonner
      richColors
      closeButton
      position={isMobile ? 'top-center' : 'bottom-right'}
      duration={2000}
      toastOptions={{
        classNames: {
          toast: '!border-border !shadow-lg',
          closeButton: '!hidden',
        },
      }}
    />
  );
};
