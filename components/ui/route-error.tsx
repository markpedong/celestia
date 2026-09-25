'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

export const RouteError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error('Celestia route error boundary.', { digest: error.digest ?? 'unavailable' });
  }, [error]);

  return (
    <section role='alert' className='celestia-card mx-auto my-10 flex max-w-lg flex-col items-center gap-4 p-8 text-center'>
      <AlertTriangle aria-hidden className='size-9 text-destructive' />
      <h1 className='text-xl font-bold'>This page could not be loaded</h1>
      <p className='text-sm text-muted-foreground'>Something went wrong while loading this page. Try again or return home.</p>
      <div className='flex flex-wrap items-center justify-center gap-3'>
        <button type='button' onClick={reset} className='inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground'>
          <RotateCw className='size-4' /> Try again
        </button>
        <Link href='/' className='inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold'>Go home</Link>
      </div>
    </section>
  );
};
