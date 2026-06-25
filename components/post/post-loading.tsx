export const PostLoading = () => (
  <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]'>
    <div className='min-w-0 max-w-3xl' role='status' aria-live='polite' aria-busy='true'>
      <article className='celestia-card overflow-hidden' aria-hidden>
        <div className='flex'>
          <div className='celestia-vote-rail min-w-14.5 border-r border-border/70 px-3 py-6'>
            <div className='mx-auto h-20 w-7 rounded bg-muted/60' />
          </div>
          <div className='min-w-0 flex-1 p-5 md:p-6'>
            <div className='flex items-center gap-2'>
              <div className='size-7 rounded-full bg-muted/70' />
              <div className='h-3 w-32 rounded-full bg-muted/70' />
              <div className='h-3 w-20 rounded-full bg-muted/40' />
            </div>
            <div className='mt-5 h-8 w-4/5 rounded bg-muted/80' />
            <div className='mt-3 h-4 w-full rounded bg-muted/45' />
            <div className='mt-2 h-4 w-3/4 rounded bg-muted/35' />
            <div className='mt-6 aspect-[16/9] rounded border border-border/70 bg-muted/45 md:aspect-[2.2/1]' />
            <div className='mt-5 flex gap-2'>
              <div className='h-8 w-24 rounded bg-muted/45' />
              <div className='h-8 w-20 rounded bg-muted/35' />
            </div>
          </div>
        </div>
        <span className='sr-only'>Loading post</span>
      </article>

      <section className='celestia-card mt-5 overflow-hidden p-4 md:p-6' aria-hidden>
        <div className='mb-5 flex items-center justify-between gap-3'>
          <div className='h-6 w-36 rounded bg-muted/80' />
          <div className='h-8 w-20 rounded bg-muted/35' />
        </div>
        <div className='mb-6 flex gap-3'>
          <div className='size-9 rounded-full bg-muted/70' />
          <div className='h-24 flex-1 rounded border border-border/70 bg-muted/35' />
        </div>
        <div className='space-y-3'>
          {[0, 1, 2].map(index => (
            <div key={index} className='flex gap-3'>
              <div className='relative flex w-9 justify-center'>
                <div className='size-9 rounded-full bg-muted/70' />
                {index < 2 ? <div className='absolute top-10 bottom-0 w-px bg-border/80' /> : null}
              </div>
              <div className='flex-1 rounded border border-border/70 bg-muted/25 p-3'>
                <div className='h-3 w-36 rounded bg-muted/70' />
                <div className='mt-3 h-3 w-full rounded bg-muted/45' />
                <div className='mt-2 h-3 w-2/3 rounded bg-muted/35' />
                <div className='mt-4 h-6 w-28 rounded bg-muted/30' />
              </div>
            </div>
          ))}
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
