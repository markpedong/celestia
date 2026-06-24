import CommunityFeed from '@/components/feed/community-feed';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import CommunityMembershipButton from '@/components/community/community-membership-button';
import { listCommunity } from '@/lib/db/queries';
import type { CommunityPageProps } from '@/lib/types';
import { notFound } from 'next/navigation';
import CommunitySidebar from '@/components/community/community-sidebar';
import CommunityStats from '@/components/community/community-stats';
import { getCommunity } from '@/services';

export const generateStaticParams = async () => {
  const communities = await listCommunity();
  return communities.map(({ slug }) => ({ slug }));
};

const CommunityPage = async ({ params }: CommunityPageProps) => {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const community = await getCommunity(slug);

  if (!community) {
    notFound();
  }

  return (
    <ContentWithSidebar sidebar={<CommunitySidebar />}>
      <section className='celestia-card mb-4 overflow-hidden'>
        <div
          className='h-24 border-b border-border/70'
          style={{ background: `linear-gradient(135deg, ${community.hashColor}55, transparent)` }}
        />
        <div className='px-5 pb-5'>
          <div className='flex flex-wrap items-end justify-between gap-4'>
            <div className='-mt-8 flex min-w-0 items-end gap-3'>
              <span
                className='grid size-16 shrink-0 place-items-center rounded-full border-4 border-card text-2xl font-black text-primary-foreground shadow-lg'
                style={{ backgroundColor: community.hashColor }}
              >
                {community.label.slice(0, 1).toUpperCase()}
              </span>
              <div className='min-w-0 pb-1'>
                <p className='text-sm font-semibold text-muted-foreground'>r/{rawSlug}</p>
                <h1 className='truncate text-2xl font-bold tracking-tight text-foreground'>{community.label}</h1>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <CommunityMembershipButton ownerID={community.createdByID ?? ''} />
            </div>
          </div>
          <p className='mt-4 max-w-2xl text-sm leading-6 text-muted-foreground'>
            {community.description ||
              'Browse community discussions, sort what is hot, and join to post or add this community to your list.'}
          </p>
          <CommunityStats />
        </div>
      </section>

      <CommunityFeed />
    </ContentWithSidebar>
  );
};

export default CommunityPage;
