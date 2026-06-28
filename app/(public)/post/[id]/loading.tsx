import Skeleton from 'react-loading-skeleton';

const Loading = () => (
  <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]' role='status' aria-live='polite' aria-busy='true'>
    <div className='min-w-0 max-w-3xl space-y-5'>
      <article className='celestia-card flex overflow-hidden' aria-hidden>
        <div className='celestia-vote-rail min-w-14.5 border-r border-border/70 px-3 py-6'>
          <Skeleton width={28} height={80} />
        </div>
        <div className='min-w-0 flex-1 p-5 md:p-6'>
          <div className='flex items-center gap-2'>
            <Skeleton circle width={28} height={28} />
            <Skeleton width={128} height={12} />
            <Skeleton width={80} height={12} />
          </div>
          <Skeleton className='mt-5' width='80%' height={32} />
          <Skeleton count={2.6} />
          <Skeleton className='mt-4' height={220} />
        </div>
      </article>

      <section className='celestia-card p-4 md:p-6' aria-hidden>
        <Skeleton width={144} height={24} />
        <Skeleton className='mt-4' count={4} />
      </section>
    </div>

    <aside className='hidden space-y-4 xl:block' aria-hidden>
      <section className='celestia-card p-4'>
        <Skeleton count={3} />
      </section>
      <section className='celestia-card p-4'>
        <Skeleton count={2} />
      </section>
    </aside>
    <span className='sr-only'>Loading post</span>
  </div>
);

export default Loading;
