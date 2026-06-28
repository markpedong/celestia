import { CommunityManagementTabs } from '@/components/community/community-management-tabs';
import { CommunityDetailsSettingsForm, CommunityVisualSettingsForm } from '@/components/community/community-settings-panels';
import { PostList } from '@/components/feed/post-list';
import { RightTrending } from '@/components/layout/right-trending';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatGrid } from '@/components/ui/stat-grid';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getSessionUser } from '@/lib/auth';
import { getPublicShellData } from '@/lib/public-data';
import type { Community, CommunityMember, CommunitySettingsPageProps, CommunityStats, CommunityFeed } from '@/lib/types';
import { formatCount, formatTimeAgo } from '@/lib/utils';
import { getCommunityBySlug, getCommunityFeedData, getCommunityStatsData, listCommunityMembers } from '@/services';
import { ArrowLeft, ExternalLink, FileText, Settings, UsersRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

const validCommunitySlug = /^[a-z0-9_-]{3,32}$/;

const CommunitySettingsPage = async ({ params }: CommunitySettingsPageProps) => {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim().toLowerCase();

  if (!validCommunitySlug.test(slug)) notFound();

  const [community, user, shellData] = await Promise.all([
    getCommunityBySlug(slug),
    getSessionUser(),
    getPublicShellData(),
  ]);
  if (!community) notFound();

  if (!user) redirect('/auth/sign-in');
  if (community.createdByID !== user.id) redirect(`/r/${community.slug}`);

  const [stats, members, feed] = await Promise.all([
    getCommunityStatsData(community.slug),
    listCommunityMembers(community.slug),
    getCommunityFeedData(community.slug, 'new', user.id),
  ]);
  const authorsByID = new Map(feed.authors.map(author => [author.id, author]));
  const authorStatsByID = new Map(feed.authorStats);
  const tagsBySlug = new Map(feed.tags.map(tag => [tag.slug, tag]));

  return (
    <main className='mx-auto w-full max-w-7xl px-4 py-6 md:py-10'>
      <Link href={`/u/${encodeURIComponent(user.userName)}`} className='mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'>
        <ArrowLeft className='size-4' /> Back to profile
      </Link>
      <div className='grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_18rem]'>
        <div className='min-w-0'>
          <section className='celestia-card mb-6 overflow-hidden'>
            <div className='relative min-h-44 border-b border-border/70 md:min-h-56'>
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
              <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,20,0.08)_0%,rgba(5,8,20,0.76)_100%)]' />
              <div className='absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 md:p-6'>
                <span
                  className='relative grid size-20 shrink-0 place-items-center overflow-hidden rounded border border-white/20 text-2xl font-black text-primary-foreground shadow-2xl md:size-24'
                  style={{ backgroundColor: community.hashColor }}
                >
                  {community.avatarUrl ? (
                    <Image src={community.avatarUrl} alt={`${community.label} profile`} fill unoptimized className='object-cover' />
                  ) : (
                    community.label.slice(0, 1).toUpperCase()
                  )}
                </span>
                <div className='min-w-0 text-white'>
                  <p className='inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-white/70'>
                    <Settings className='size-3.5' /> Owner tools
                  </p>
                  <h1 className='mt-1 truncate text-3xl font-black tracking-tight md:text-4xl'>Manage r/{community.slug}</h1>
                </div>
              </div>
            </div>
            <div className='p-5 text-sm leading-6 text-muted-foreground md:p-6'>
              Update the public identity, cover image, profile image, and color system for your community.
            </div>
          </section>
          <CommunityManagementTabs
            memberCount={stats.memberCount}
            postCount={stats.postCount}
            overview={<CommunityOverview community={community} stats={stats} members={members} feed={feed} />}
            details={<CommunityDetailsSettingsForm community={community} />}
            visuals={<CommunityVisualSettingsForm community={community} />}
            members={<CommunityMembersPanel members={members} />}
            posts={
              feed.rows.length ? (
                <div className='space-y-3'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <p className='celestia-panel-label'>Posts</p>
                      <h2 className='mt-2 text-xl font-bold tracking-tight'>Community posts</h2>
                    </div>
                    <Button asChild size='sm'>
                      <Link href={`/submit?community=${encodeURIComponent(community.slug)}`}>Create post</Link>
                    </Button>
                  </div>
                  <PostList
                    rows={feed.rows}
                    authorsByID={authorsByID}
                    authorStatsByID={authorStatsByID}
                    tagsBySlug={tagsBySlug}
                    isSignedIn
                  />
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title='No posts yet'
                  description={`Posts published in r/${community.slug} will show here.`}
                  className='py-12'
                >
                  <Button asChild size='sm'>
                    <Link href={`/submit?community=${encodeURIComponent(community.slug)}`}>Create first post</Link>
                  </Button>
                </EmptyState>
              )
            }
          />
        </div>
        <aside className='hidden min-w-0 2xl:block'>
          <div className='sticky top-20'>
            <RightTrending items={shellData.trending} communities={shellData.communities} />
          </div>
        </aside>
      </div>
    </main>
  );
};

const CommunityOverview = ({
  community,
  stats,
  members,
  feed,
}: {
  community: Community;
  stats: CommunityStats;
  members: CommunityMember[];
  feed: CommunityFeed;
}) => (
  <div className='space-y-5'>
    <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]'>
      <div className='min-w-0 rounded border border-border bg-muted/25 p-4'>
        <p className='celestia-panel-label'>Overview</p>
        <h2 className='mt-2 text-xl font-bold tracking-tight'>r/{community.slug}</h2>
        <p className='mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground'>
          {community.description || 'No community description yet.'}
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          <Button asChild size='sm' variant='outline'>
            <Link href={`/r/${encodeURIComponent(community.slug)}`}>
              <ExternalLink /> View community
            </Link>
          </Button>
          <Button asChild size='sm'>
            <Link href={`/submit?community=${encodeURIComponent(community.slug)}`}>Create post</Link>
          </Button>
        </div>
      </div>
      <StatGrid
        className='grid-cols-1'
        stats={[
          { label: 'Members', value: formatCount(stats.memberCount) },
          { label: 'Posts', value: formatCount(stats.postCount) },
          { label: 'Comments', value: formatCount(stats.commentCount) },
        ]}
      />
    </div>
    <div className='grid gap-5 lg:grid-cols-2'>
      <section className='rounded border border-border bg-muted/25 p-4'>
        <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold'>
          <UsersRound className='size-4 text-primary' /> New members
        </h3>
        {members.length ? (
          <div className='space-y-2'>
            {members.slice(0, 5).map(member => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No members have joined yet.</p>
        )}
      </section>
      <section className='rounded border border-border bg-muted/25 p-4'>
        <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold'>
          <FileText className='size-4 text-primary' /> Recent posts
        </h3>
        {feed.rows.length ? (
          <div className='space-y-2'>
            {feed.rows.slice(0, 5).map(({ post, score }) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className='block rounded border border-border bg-background/60 px-3 py-2 celestia-hover-surface'
              >
                <p className='truncate text-sm font-semibold'>{post.title}</p>
                <p className='mt-1 font-mono text-[11px] text-muted-foreground'>
                  {formatTimeAgo(post.createdAt)} · {score} score · {post.commentCount} comments
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No posts have been published yet.</p>
        )}
      </section>
    </div>
  </div>
);

const CommunityMembersPanel = ({ members }: { members: CommunityMember[] }) =>
  members.length ? (
    <section className='space-y-3'>
      <div>
        <p className='celestia-panel-label'>Members</p>
        <h2 className='mt-2 text-xl font-bold tracking-tight'>People who joined</h2>
        <p className='mt-1 text-sm text-muted-foreground'>The latest members following this community.</p>
      </div>
      <div className='grid gap-2 md:grid-cols-2'>
        {members.map(member => (
          <MemberRow key={member.id} member={member} />
        ))}
      </div>
    </section>
  ) : (
    <EmptyState
      icon={UsersRound}
      title='No members yet'
      description='People who join this community will show here.'
      className='py-12'
    />
  );

const MemberRow = ({ member }: { member: CommunityMember }) => {
  const label = member.displayName || member.userName;

  return (
    <Link
      href={`/u/${encodeURIComponent(member.userName)}`}
      className='flex min-w-0 items-center gap-3 rounded border border-border bg-background/60 px-3 py-2 celestia-hover-surface'
    >
      <UserAvatar user={member} />
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-semibold'>{label}</span>
        <span className='block truncate font-mono text-[11px] text-muted-foreground'>u/{member.userName}</span>
      </span>
      <span className='shrink-0 text-xs text-muted-foreground'>{formatTimeAgo(member.joinedAt)}</span>
    </Link>
  );
};

export default CommunitySettingsPage;
