import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import Skeleton from 'react-loading-skeleton';

const CommunityLoading = () => (
  <ContentWithSidebar sidebar={<CommunitySidebarSkeleton />}>
    <div role='status' aria-live='polite' aria-busy='true'>
      <section className='celestia-card mb-5 overflow-hidden'>
        <Skeleton height={256} borderRadius={0} />
        <div className='relative grid gap-5 border-t border-border/70 p-5 pt-16 md:grid-cols-[minmax(0,1fr)_18rem] md:p-6 md:pt-6'>
          <div className='absolute left-5 -top-14 z-20 size-24 overflow-hidden rounded border-4 border-card bg-card md:left-7 md:-top-20'>
            <Skeleton height='100%' />
          </div>
          <div>
            <Skeleton width={88} height={12} />
            <Skeleton width='55%' height={36} />
            <Skeleton className='mt-4' width='80%' />
            <Skeleton width='64%' />
          </div>
          <div className='grid grid-cols-3 gap-2 md:grid-cols-1'>
            {[0, 1, 2].map(item => (
              <Skeleton key={item} height={44} />
            ))}
          </div>
        </div>
      </section>

      <section className='space-y-3'>
        {[0, 1, 2].map(item => (
          <div key={item} className='celestia-card p-4'>
            <Skeleton width='35%' />
            <Skeleton width='70%' />
            <Skeleton count={2} />
          </div>
        ))}
      </section>
    </div>
    <span className='sr-only'>Loading community</span>
  </ContentWithSidebar>
);

const CommunitySidebarSkeleton = () => (
  <div className='space-y-4'>
    <section className='celestia-card overflow-hidden'>
      <Skeleton height={8} borderRadius={0} />
      <div className='space-y-3 p-4'>
        <Skeleton width={128} />
        <Skeleton count={3} />
      </div>
    </section>
    <section className='celestia-card p-4'>
      <Skeleton width={112} />
      <Skeleton height={38} />
      <Skeleton height={38} />
    </section>
  </div>
);

export default CommunityLoading;
