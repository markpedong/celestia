import Skeleton from 'react-loading-skeleton';

const CommunitySettingsLoading = () => (
  <main className='mx-auto w-full max-w-7xl px-4 py-6 md:py-10'>
    <div role='status' aria-live='polite' aria-busy='true'>
      <div className='mb-6'>
        <Skeleton width={136} height={20} />
      </div>
      <div className='grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_18rem]'>
        <div className='min-w-0'>
          <section className='celestia-card mb-6 overflow-hidden'>
            <Skeleton height={224} borderRadius={0} />
            <div className='relative border-t border-border/70 p-5 pt-16 md:p-6 md:pt-6'>
              <div className='absolute left-5 -top-14 z-20 size-24 overflow-hidden rounded border-4 border-card bg-card md:left-6 md:-top-16'>
                <Skeleton height='100%' />
              </div>
              <Skeleton width={112} height={12} />
              <Skeleton width='48%' height={34} />
              <Skeleton className='mt-4' width='72%' />
            </div>
          </section>

          <nav className='mb-5 flex gap-2 border-b border-border/80'>
            {[92, 82, 76, 88, 72].map(width => (
              <div key={width} className='px-3 py-2.5'>
                <Skeleton width={width} height={16} />
              </div>
            ))}
          </nav>

          <section className='celestia-card p-5'>
            <Skeleton width='30%' />
            <Skeleton width='65%' />
            <div className='mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]'>
              <Skeleton height={160} />
              <div className='space-y-3'>
                <Skeleton height={52} />
                <Skeleton height={52} />
                <Skeleton height={52} />
              </div>
            </div>
          </section>
        </div>

        <aside className='hidden min-w-0 2xl:block'>
          <div className='space-y-4'>
            <section className='celestia-card p-4'>
              <Skeleton count={4} />
            </section>
            <section className='celestia-card p-4'>
              <Skeleton count={5} />
            </section>
          </div>
        </aside>
      </div>
    </div>
    <span className='sr-only'>Loading community settings</span>
  </main>
);

export default CommunitySettingsLoading;
