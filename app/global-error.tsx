'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    // Next.js logs server exceptions separately. Never print a potentially
    // sensitive error message or stack to the client console.
    console.error('Celestia global error boundary.', { digest: error.digest ?? 'unavailable' });
  }, [error]);

  return (
    <html lang='en'>
      <body className='celestia-app-shell min-h-full flex flex-col bg-background text-foreground'>
        <main className='flex min-h-dvh flex-1 flex-col items-center justify-center px-4 py-10'>
          <div className='w-full max-w-md rounded-2xl border border-border bg-background/72 p-8 shadow-xl backdrop-blur-md'>
            <div className='flex flex-col items-center gap-4 text-center'>
              <div className='grid size-14 place-items-center rounded-full bg-destructive/15 text-destructive'>
                <AlertTriangle className='size-7' />
              </div>
              <h1 className='text-balance text-xl font-bold tracking-tight text-foreground'>
                Something went wrong
              </h1>
              <p className='text-sm text-muted-foreground'>
                An unexpected error occurred. You can try again, or return to the homepage if the problem persists.
              </p>
              <div className='mt-2 flex w-full flex-col gap-2 sm:flex-row'>
                <button
                  type='button'
                  onClick={reset}
                  className='inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90'
                >
                  <RotateCw className='size-4' /> Try again
                </button>
                <Link
                  href='/'
                  className='inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted'
                >
                  Go home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
