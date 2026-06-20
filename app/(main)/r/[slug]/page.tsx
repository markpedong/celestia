import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import { PostList } from '@/components/feed/post-list';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import { Button } from '@/components/ui/button';
import { CommunityMembershipButton } from '@/components/community/community-membership-button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatGrid } from '@/components/ui/stat-grid';
import { getSessionUser } from '@/lib/auth';
import { batchAuthorsForIds, batchUserStatsForIds, getCommunityMembership, getCommunityStats, getTagBySlug, listPostSorted, listTags } from '@/lib/db/queries';
import { formatCount } from '@/lib/format';
import type { CommunityPageProps, FeedSort } from '@/lib/types';
import { CakeSlice, Hash, Plus, Settings, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const CommunityPage = async ({ params, searchParams }: CommunityPageProps) => {
  const [{ slug: rawSlug }, query] = await Promise.all([params, searchParams]);
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const [community, sessionUser] = await Promise.all([getTagBySlug(slug), getSessionUser()]);

  if (!community) {
    notFound();
  }

  const isOwner = sessionUser?.id === community.createdById;
  const rawSort = (Array.isArray(query.sort) ? query.sort[0] : query.sort) as FeedSort | undefined;
  const sort: FeedSort = rawSort === 'new' || rawSort === 'top' ? rawSort : 'hot';
  const searchQuery = Array.isArray(query.q) ? query.q[0] ?? '' : query.q ?? '';
  const cleanedSearchQuery = searchQuery.trim();

  const [rows, tags, stats, isMember] = await Promise.all([
    listPostSorted(sort, community.slug, sessionUser?.id, cleanedSearchQuery),
    listTags(),
    getCommunityStats(community.slug),
    getCommunityMembership(sessionUser?.id, community.slug),
  ]);
  const tagsMap = new Map(tags.map(tag => [tag.slug, tag]));
  const authorIds = [...new Set(rows.map(row => row.post.authorId))];
  const [authorById, authorStatsById] = await Promise.all([batchAuthorsForIds(authorIds), batchUserStatsForIds(authorIds)]);

  return (
    <ContentWithSidebar
      sidebar={
        <section className='celestia-card p-4'>
          <h2 className='mb-3 text-sm font-semibold'>About Community</h2>
          <p className='text-xs leading-6 text-muted-foreground'>
            r/{community.slug} is a real community with membership. Join it to add it to your communities and create posts there.
          </p>
          <div className='mt-4 space-y-2 text-xs text-muted-foreground'>
            <p className='flex items-center gap-2'><Users className='size-3 text-primary' /> {formatCount(stats.memberCount)} members</p>
            <p className='flex items-center gap-2'><CakeSlice className='size-3 text-primary' /> Community discussions</p>
          </div>
        </section>
      }
    >
        <section className='celestia-card mb-4 overflow-hidden'>
          <div className='h-24 border-b border-border/70' style={{ background: `linear-gradient(135deg, ${community.hashColor}55, transparent)` }} />
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
                <CommunityMembershipButton slug={community.slug} isMember={isMember} isSignedIn={Boolean(sessionUser)} isOwner={isOwner} />
                {isMember ? <Button asChild size='sm' className='celestia-primary-action rounded-full'>
                  <Link href={`/submit?community=${encodeURIComponent(community.slug)}`}>
                    <Plus className='size-3.5' />
                    Create Post
                  </Link>
                </Button> : null}
                {isOwner ? <Button asChild size='sm' variant='outline' className='rounded-full'>
                  <Link href={`/r/${encodeURIComponent(community.slug)}/settings`}>
                    <Settings className='size-3.5' /> Manage
                  </Link>
                </Button> : null}
              </div>
            </div>
            <p className='mt-4 max-w-2xl text-sm leading-6 text-muted-foreground'>
              {community.description || 'Browse community discussions, sort what is hot, and join to post or add this community to your list.'}
            </p>
            {isOwner ? <p className='mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary'><ShieldCheck className='size-3.5' /> You created and own this community.</p> : null}
            <StatGrid className='mt-4 max-w-lg' stats={[
              { label: 'Posts', value: formatCount(stats.postCount) },
              { label: 'Members', value: formatCount(stats.memberCount) },
              { label: 'Comments', value: formatCount(stats.commentCount) },
            ]} />
          </div>
        </section>

        <FeedSortTabs current={sort} tag='' query={cleanedSearchQuery} basePath={`/r/${community.slug}`} />
        {cleanedSearchQuery ? (
          <div className='mb-4 rounded border border-border/80 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground'>
            Searching r/{community.slug} for <span className='font-semibold text-foreground'>&quot;{cleanedSearchQuery}&quot;</span>
          </div>
        ) : null}
        <div className='space-y-3'>
          <PostList rows={rows} authorsById={authorById} authorStatsById={authorStatsById} tagsBySlug={tagsMap} />
          {rows.length === 0 ? (
            <EmptyState icon={Hash} title={`No posts in r/${community.slug} yet`} description='Start the first thread for this community.' />
          ) : null}
        </div>
    </ContentWithSidebar>
  );
};

export const generateStaticParams = async () => {
  const communities = await listTags();
  return communities.map(({ slug }) => ({ slug }));
};

export default CommunityPage;
