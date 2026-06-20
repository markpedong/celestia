'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Orbit, Search, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className='flex min-h-dvh items-center justify-center px-4 py-10'>
      <section className='relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-primary/10'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,var(--primary)_0,transparent_34%),radial-gradient(circle_at_82%_22%,var(--accent)_0,transparent_24%)] opacity-10' />
        <div className='relative grid gap-0 md:grid-cols-[1fr_18rem]'>
          <div className='p-6 md:p-8'>
            <div className='mb-8 flex items-center gap-2 text-sm font-semibold text-primary'>
              <span className='celestia-brand-mark size-8'>
                <Zap className='size-4 fill-current' />
              </span>
              Celestia
            </div>

            <p className='mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground'>404 signal lost</p>
            <h1 className='text-balance text-4xl font-black tracking-tight text-foreground md:text-5xl'>
              This thread drifted out of orbit.
            </h1>
            <p className='mt-4 max-w-xl text-sm leading-7 text-muted-foreground'>
              The page might have been moved, deleted, or typed a little sideways. Head back to the feed or return to where you came from.
            </p>

            <div className='mt-7 flex flex-wrap gap-3'>
              <Button asChild size='lg' className='celestia-primary-action h-10 rounded-full px-4'>
                <Link href='/'>
                  <Home className='size-4' />
                  Navigate to home
                </Link>
              </Button>
              <Button
                type='button'
                variant='outline'
                size='lg'
                className='h-10 rounded-full px-4'
                onClick={() => window.history.back()}
              >
                <ArrowLeft className='size-4' />
                Go back
              </Button>
            </div>
          </div>

          <div className='relative hidden border-l border-border/70 bg-muted/35 md:block'>
            <div className='absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/25' />
            <div className='absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/25' />
            <div className='absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary/15 text-primary shadow-[0_0_36px] shadow-primary/20'>
              <Search className='size-7' />
            </div>
            <Orbit className='absolute left-8 top-10 size-7 rotate-12 text-primary/70' />
            <Sparkles className='absolute bottom-12 right-10 size-6 text-accent/80' />
            <span className='absolute right-8 top-8 font-mono text-5xl font-black text-muted-foreground/20'>404</span>
          </div>
        </div>
      </section>
    </main>
  );
}
