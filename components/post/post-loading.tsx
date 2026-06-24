import { CelestiaSignalLoader } from '@/components/ui/celestia-signal-loader';

export const PostLoading = () => (
  <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]'>
    <div className='min-w-0 max-w-3xl' role='status' aria-live='polite' aria-busy='true'>
      <article className='celestia-card celestia-post-loader-stage overflow-hidden'>
        <div className='celestia-post-loader-glow' aria-hidden />
        <div className='relative z-10 flex flex-col items-center text-center'>
          <CelestiaSignalLoader />
          <p className='mt-5 text-sm font-semibold text-foreground'>Pulling this thread into orbit</p>
          <p className='mt-1 text-sm text-muted-foreground'>Receiving the post signal…</p>
        </div>
        <span className='sr-only'>Loading post</span>
      </article>

      <section className='celestia-card mt-5 overflow-hidden p-4 md:p-6' aria-hidden>
        <div className='mb-5 h-5 w-32 rounded-full bg-muted/80' />
        <div className='space-y-4'>
          <div className='h-16 rounded-lg bg-muted/50' />
          <div className='h-16 rounded-lg bg-muted/35' />
        </div>
      </section>
    </div>

    <aside className='hidden space-y-4 xl:block' aria-hidden>
      <section className='celestia-card p-4'>
        <div className='h-3 w-28 rounded-full bg-muted/80' />
        <div className='mt-4 h-16 rounded-lg bg-muted/45' />
        <div className='mt-3 h-16 rounded-lg bg-muted/35' />
      </section>
      <section className='celestia-card p-4'>
        <div className='h-3 w-28 rounded-full bg-muted/80' />
        <div className='mt-4 h-18 rounded-lg bg-muted/35' />
      </section>
    </aside>
  </div>
);
