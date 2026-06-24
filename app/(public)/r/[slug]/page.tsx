import CommunityFeed from '@/components/feed/community-feed';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import { CommunityMembershipButton } from '@/components/community/community-membership-button';
import { StatGrid } from '@/components/ui/stat-grid';
import {
  getCommunityBySlug,
  getCommunityStats,
  listTags,
} from '@/lib/db/queries';
import { formatCount } from '@/lib/format';
import type { CommunityPageProps } from '@/lib/types';
import { CakeSlice, Users } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 300;
export const dynamicParams = true;

export const generateStaticParams = async () => {
  const communities = await listTags();
  return communities.map(({ slug }) => ({ slug }));
};

const CommunityPage = async ({ params }: CommunityPageProps) => {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const community = await getCommunityBySlug(slug);

  if (!community) {
    notFound();
  }

  const stats = await getCommunityStats(community.slug);

  return (
    <ContentWithSidebar
      sidebar={
        <section className='celestia-card p-4'>
          <h2 className='mb-3 text-sm font-semibold'>About Community</h2>
          <p className='text-xs leading-6 text-muted-foreground'>
            r/{community.slug} is a real community with membership. Join it to add it to your communities and create
            posts there.
          </p>
          <div className='mt-4 space-y-2 text-xs text-muted-foreground'>
            <p className='flex items-center gap-2'>
              <Users className='size-3 text-primary' /> {formatCount(stats.memberCount)} members
            </p>
            <p className='flex items-center gap-2'>
              <CakeSlice className='size-3 text-primary' /> Community discussions
            </p>
          </div>
        </section>
      }
    >
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
                <p className='text-sm font-semibold text-muted-foreground'>r/{community.slug}</p>
                <h1 className='truncate text-2xl font-bold tracking-tight text-foreground'>{community.label}</h1>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <CommunityMembershipButton
                slug={community.slug}
                ownerId={community.createdById ?? undefined}
                showCreatePost
              />
            </div>
          </div>
          <p className='mt-4 max-w-2xl text-sm leading-6 text-muted-foreground'>
            {community.description ||
              'Browse community discussions, sort what is hot, and join to post or add this community to your list.'}
          </p>
          <StatGrid
            className='mt-4 max-w-lg'
            stats={[
              { label: 'Posts', value: formatCount(stats.postCount) },
              { label: 'Members', value: formatCount(stats.memberCount) },
              { label: 'Comments', value: formatCount(stats.commentCount) },
            ]}
          />
        </div>
      </section>

      <CommunityFeed slug={community.slug} />
    </ContentWithSidebar>
  );
};

export default CommunityPage;
