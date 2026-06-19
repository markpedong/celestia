import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import PostCard from '@/components/feed/post-card';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth';
import { batchAuthorsForIds, getCommunityStats, getTagBySlug, listPostSorted, listTags } from '@/lib/db/queries';
import { formatCount } from '@/lib/format';
import { FeedSort } from '@/lib/types';
import { Bell, CakeSlice, Hash, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CommunityPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params;
  const query = await searchParams;
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const community = await getTagBySlug(slug);

  if (!community) {
    notFound();
  }

  const sessionUser = await getSessionUser();
  const rawSort = (Array.isArray(query.sort) ? query.sort[0] : query.sort) as FeedSort | undefined;
  const sort: FeedSort = rawSort === 'new' || rawSort === 'top' ? rawSort : 'hot';
  const searchQuery = Array.isArray(query.q) ? query.q[0] ?? '' : query.q ?? '';
  const cleanedSearchQuery = searchQuery.trim();

  const [rows, tags, stats] = await Promise.all([
    listPostSorted(sort, community.slug, sessionUser?.id, cleanedSearchQuery),
    listTags(),
    getCommunityStats(community.slug),
  ]);
  const tagsMap = new Map(tags.map(tag => [tag.slug, tag]));
  const authorById = await batchAuthorsForIds([...new Set(rows.map(row => row.post.authorId))]);

  return (
    <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]'>
      <div className='min-w-0'>
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
                <Button variant='outline' size='sm' className='rounded-full'>
                  <Bell className='size-3.5' />
                  Follow
                </Button>
                <Button asChild size='sm' className='celestia-primary-action rounded-full'>
                  <Link href='/submit'>
                    <Plus className='size-3.5' />
                    Create Post
                  </Link>
                </Button>
              </div>
            </div>
            <p className='mt-4 max-w-2xl text-sm leading-6 text-muted-foreground'>
              A topic community for posts tagged with {community.label}. Browse discussions, sort what is hot, and jump into threads.
            </p>
            <div className='mt-4 grid max-w-lg grid-cols-3 gap-2 text-sm'>
              <Stat label='Posts' value={formatCount(stats.postCount)} />
              <Stat label='Members' value={formatCount(stats.memberCount)} />
              <Stat label='Comments' value={formatCount(stats.commentCount)} />
            </div>
          </div>
        </section>

        <FeedSortTabs current={sort} tag='' query={cleanedSearchQuery} basePath={`/r/${community.slug}`} />
        {cleanedSearchQuery ? (
          <div className='mb-4 rounded-xl border border-border/80 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground'>
            Searching r/{community.slug} for <span className='font-semibold text-foreground'>&quot;{cleanedSearchQuery}&quot;</span>
          </div>
        ) : null}
        <div className='space-y-3'>
          {rows.map(row => {
            const author = authorById.get(row.post.authorId);
            if (!author) return null;

            return (
              <PostCard
                key={row.post.id}
                post={row.post}
                author={author}
                tagsBySlug={tagsMap}
                score={row.score}
                userVote={row.userVote}
              />
            );
          })}
          {rows.length === 0 ? (
            <div className='celestia-card px-6 py-16 text-center'>
              <Hash className='mx-auto mb-3 size-8 text-primary' />
              <h2 className='text-base font-semibold'>No posts in r/{community.slug} yet</h2>
              <p className='mt-2 text-sm text-muted-foreground'>Start the first thread for this community.</p>
            </div>
          ) : null}
        </div>
      </div>

      <aside className='hidden xl:block'>
        <div className='sticky top-20 space-y-4'>
          <section className='celestia-card p-4'>
            <h2 className='mb-3 text-sm font-semibold'>About Community</h2>
            <p className='text-xs leading-6 text-muted-foreground'>
              r/{community.slug} collects every post tagged {community.label}. Following and membership are visual for now while the community model is tag-based.
            </p>
            <div className='mt-4 space-y-2 text-xs text-muted-foreground'>
              <p className='flex items-center gap-2'><Users className='size-3 text-primary' /> {formatCount(stats.memberCount)} contributors</p>
              <p className='flex items-center gap-2'><CakeSlice className='size-3 text-primary' /> Created with Celestia topics</p>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className='rounded-xl border border-border bg-muted/40 px-3 py-2'>
    <p className='font-mono text-sm font-semibold text-foreground'>{value}</p>
    <p className='text-[11px] text-muted-foreground'>{label}</p>
  </div>
);
