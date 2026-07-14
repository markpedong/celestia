'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

export const ShareButton = ({
  path,
  title,
  className,
  label = 'Share',
}: {
  path: string;
  title?: string;
  className?: string;
  label?: string;
}) => {
  const share = async () => {
    const url = new URL(path, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied.');
    } catch {
      toast.error('Unable to copy this link.');
    }
  };

  return (
    <button type='button' className={className} onClick={() => void share()}>
      <Share2 className='size-3.5' />
      {label}
    </button>
  );
};
