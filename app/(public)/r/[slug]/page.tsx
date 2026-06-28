import CommunityFeed from '@/components/feed/community-feed';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import CommunityMembershipButton from '@/components/community/community-membership-button';
import type { CommunityPageProps } from '@/lib/types';
import { getCommunityBySlug, listCommunity } from '@/lib/db/community.queries';
import { notFound } from 'next/navigation';
import CommunitySidebar from '@/components/community/community-sidebar';
import CommunityStats from '@/components/community/community-stats';
import Image from 'next/image';

export const generateStaticParams = async () => {
  const communities = await listCommunity();
  return communities.map(({ slug }) => ({ slug }));
};

const CommunityPage = async ({ params }: CommunityPageProps) => {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const community = await getCommunityBySlug(slug);

  if (!community) {
    notFound();
  }

  return (
    <ContentWithSidebar sidebar={<CommunitySidebar community={community} />}>
      <section className='celestia-card mb-5 overflow-hidden'>
        <div className='relative min-h-52 overflow-hidden border-b border-border/70 md:min-h-64'>
          {community.coverUrl ? (
            <Image src={community.coverUrl} alt={`${community.label} cover`} fill unoptimized className='object-cover' />
          ) : (
            <div
              className='size-full'
              style={{
                background: `
                  radial-gradient(circle at 18% 24%, ${community.hashColor}90, transparent 34%),
                  linear-gradient(135deg, ${community.hashColor}66, color-mix(in srgb, var(--accent) 22%, transparent))
                `,
              }}
            />
          )}
          <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,20,0.1)_0%,rgba(5,8,20,0.58)_70%,rgba(5,8,20,0.9)_100%)]' />
          <div className='absolute inset-x-0 bottom-0 p-5 md:p-7'>
            <div className='flex flex-col gap-5 md:flex-row md:items-end md:justify-between'>
              <div className='flex min-w-0 items-end gap-4'>
                <span
                  className='relative grid size-20 shrink-0 place-items-center overflow-hidden rounded border border-white/20 text-3xl font-black text-primary-foreground shadow-2xl md:size-24'
                  style={{ backgroundColor: community.hashColor }}
                >
                  {community.avatarUrl ? (
                    <Image
                      src={community.avatarUrl}
                      alt={`${community.label} profile`}
                      fill
                      unoptimized
                      className='object-cover'
                    />
                  ) : (
                    community.label.slice(0, 1).toUpperCase()
                  )}
                </span>
                <div className='min-w-0 pb-0.5 text-white'>
                  <p className='font-mono text-xs font-semibold uppercase tracking-wider text-white/70'>r/{rawSlug}</p>
                  <h1 className='mt-1 truncate text-3xl font-black tracking-tight md:text-5xl'>{community.label}</h1>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <CommunityMembershipButton ownerID={community.createdByID ?? ''} />
              </div>
            </div>
          </div>
        </div>
        <div className='grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_18rem] md:p-6'>
          <p className='mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-muted-foreground'>
            {community.description ||
              'Browse community discussions, sort what is hot, and join to post or add this community to your list.'}
          </p>
          <CommunityStats className='mt-0' />
        </div>
      </section>

      <CommunityFeed />
    </ContentWithSidebar>
  );
};

export default CommunityPage;
