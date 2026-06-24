import { CelestiaSignalLoader } from '@/components/ui/celestia-signal-loader';

export const CommunityLoading = () => (
  <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]' role='status' aria-live='polite' aria-busy='true'>
    <div className='min-w-0'>
      <section className='celestia-card mb-4 overflow-hidden' aria-hidden>
        <div className='h-24 bg-muted/40' />
        <div className='px-5 pb-5'>
          <div className='-mt-8 flex items-end gap-3'>
            <div className='size-16 rounded-full border-4 border-card bg-muted/80' />
            <div className='space-y-2 pb-1'>
              <div className='h-3 w-20 rounded-full bg-muted/70' />
              <div className='h-7 w-40 rounded-md bg-muted/80' />
            </div>
          </div>
          <div className='mt-5 h-4 max-w-xl rounded-full bg-muted/50' />
          <div className='mt-2 h-4 w-3/4 max-w-md rounded-full bg-muted/35' />
        </div>
      </section>

      <section className='celestia-card celestia-post-loader-stage relative grid min-h-[20rem] place-items-center overflow-hidden p-6'>
        <div className='celestia-post-loader-glow' aria-hidden />
        <div className='relative z-10 flex flex-col items-center text-center'>
          <CelestiaSignalLoader />
          <p className='mt-5 text-sm font-semibold text-foreground'>Tuning into this community</p>
          <p className='mt-1 text-sm text-muted-foreground'>Gathering the latest signals…</p>
        </div>
      </section>
      <span className='sr-only'>Loading community</span>
    </div>

    <aside className='hidden space-y-4 xl:block' aria-hidden>
      <section className='celestia-card p-4'>
        <div className='h-3 w-28 rounded-full bg-muted/80' />
        <div className='mt-4 h-20 rounded-lg bg-muted/40' />
      </section>
      <section className='celestia-card p-4'>
        <div className='h-3 w-32 rounded-full bg-muted/80' />
        <div className='mt-4 h-30 rounded-lg bg-muted/35' />
      </section>
    </aside>
  </div>
);
