import Skeleton from 'react-loading-skeleton';

const Loading = () => (
  <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]' role='status' aria-live='polite' aria-busy='true'>
    <div className='min-w-0 space-y-4'>
      <section className='celestia-card overflow-hidden' aria-hidden>
        <Skeleton height={96} borderRadius={0} />
        <div className='px-5 pb-5'>
          <div className='-mt-8 flex items-end gap-3'>
            <Skeleton circle width={64} height={64} />
            <div>
              <Skeleton width={80} height={12} />
              <Skeleton width={160} height={28} />
            </div>
          </div>
          <Skeleton className='mt-5' width='75%' />
          <Skeleton width='60%' />
        </div>
      </section>

      <section className='celestia-card p-4' aria-hidden>
        <Skeleton count={5} />
      </section>
    </div>

    <aside className='hidden space-y-4 xl:block' aria-hidden>
      <section className='celestia-card p-4'>
        <Skeleton count={3} />
      </section>
      <section className='celestia-card p-4'>
        <Skeleton count={4} />
      </section>
    </aside>
    <span className='sr-only'>Loading community</span>
  </div>
);

export default Loading;
