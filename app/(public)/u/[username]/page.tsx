import { ClientProfileControls } from '@/components/auth/client-profile-controls';
import { PostList } from '@/components/feed/post-list';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import { ProfileActivityTabs } from '@/components/profile/profile-activity-tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { StatGrid } from '@/components/ui/stat-grid';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getSessionUser } from '@/lib/auth';
import {
  batchAuthorsForIds,
  batchUserStatsForIds,
  getUserByUsername,
  getUserStats,
  listCommentsByAuthor,
  listPostsByAuthor,
  listTags,
  listUsernames,
  listVotedCommentsByUser,
  listVotedPostsByUser,
} from '@/lib/db/queries';
import { formatCount, formatRelativeTime } from '@/lib/format';
import type { CommentsListProps, ProfileActivityTab, UserPageProps } from '@/lib/types';
import { ArrowBigDown, ArrowBigUp, AtSign, CakeSlice, FileText, MessageSquare, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 300;
export const dynamicParams = true;

const validTabs: ProfileActivityTab[] = ['overview', 'posts', 'comments', 'upvoted', 'downvoted'];

const excerpt = (body: string) => {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > 180 ? `${clean.slice(0, 180)}...` : clean;
};

const UserPage = async ({ params, searchParams }: UserPageProps) => {
  const { username: rawUsername } = await params;
  const query = await searchParams;
  const username = decodeURIComponent(rawUsername);
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const activeTab = validTabs.includes(requestedTab as ProfileActivityTab) ? requestedTab as ProfileActivityTab : 'overview';
  const profile = await getUserByUsername(username);
  if (!profile) notFound();

  const showOwnPosts = activeTab === 'overview' || activeTab === 'posts';
  const showOwnComments = activeTab === 'overview' || activeTab === 'comments';
  const showUpvotes = activeTab === 'overview' || activeTab === 'upvoted';
  const showDownvotes = activeTab === 'overview' || activeTab === 'downvoted';
  const sessionUser = await getSessionUser();
  const [tags, stats, posts, comments, upvotedPosts, upvotedComments, downvotedPosts, downvotedComments] = await Promise.all([
    listTags(),
    getUserStats(profile.id),
    showOwnPosts ? listPostsByAuthor(profile.id, 'new', sessionUser?.id) : Promise.resolve([]),
    showOwnComments ? listCommentsByAuthor(profile.id) : Promise.resolve([]),
    showUpvotes ? listVotedPostsByUser(profile.id, 1, sessionUser?.id) : Promise.resolve([]),
    showUpvotes ? listVotedCommentsByUser(profile.id, 1) : Promise.resolve([]),
    showDownvotes ? listVotedPostsByUser(profile.id, -1, sessionUser?.id) : Promise.resolve([]),
    showDownvotes ? listVotedCommentsByUser(profile.id, -1) : Promise.resolve([]),
  ]);
  const allRows = [...posts, ...upvotedPosts, ...downvotedPosts];
  const authorIds = [...new Set(allRows.map(({ post }) => post.authorId).concat(profile.id))];
  const [authorsById, authorStatsById] = await Promise.all([batchAuthorsForIds(authorIds), batchUserStatsForIds(authorIds)]);
  const tagsBySlug = new Map(tags.map(tag => [tag.slug, tag]));
  const hasActivity = posts.length + comments.length + upvotedPosts.length + upvotedComments.length + downvotedPosts.length + downvotedComments.length > 0;

  const renderPosts = (rows: typeof posts, title?: string) => rows.length ? (
    <section className='space-y-3'>
      {title ? <h2 className='flex items-center gap-2 text-sm font-semibold'>{title}</h2> : null}
      <PostList rows={rows} authorsById={authorsById} authorStatsById={authorStatsById} tagsBySlug={tagsBySlug} isSignedIn={Boolean(sessionUser)} />
    </section>
  ) : null;

  const content = (() => {
    if (activeTab === 'posts') return renderPosts(posts) ?? <ProfileEmpty icon={FileText} title='No posts yet' description={`Posts from u/${profile.username} will show here.`} />;
    if (activeTab === 'comments') return comments.length ? <CommentsList comments={comments} title='Comments' /> : <ProfileEmpty icon={MessageSquare} title='No comments yet' description={`Comments from u/${profile.username} will show here.`} />;
    if (activeTab === 'upvoted') return <VotedActivity posts={upvotedPosts} comments={upvotedComments} direction='up' emptyFor={profile.username} renderPosts={renderPosts} />;
    if (activeTab === 'downvoted') return <VotedActivity posts={downvotedPosts} comments={downvotedComments} direction='down' emptyFor={profile.username} renderPosts={renderPosts} />;
    return hasActivity ? <div className='space-y-6'>
      {renderPosts(posts, 'Posts')}
      {comments.length ? <CommentsList comments={comments} title='Comments' /> : null}
      <VotedActivity posts={upvotedPosts} comments={upvotedComments} direction='up' emptyFor={profile.username} renderPosts={renderPosts} compact />
      <VotedActivity posts={downvotedPosts} comments={downvotedComments} direction='down' emptyFor={profile.username} renderPosts={renderPosts} compact />
    </div> : <ProfileEmpty icon={AtSign} title='No activity yet' description={`Posts, comments, and votes from u/${profile.username} will show here.`} />;
  })();

  return (
    <ContentWithSidebar sidebar={<ProfileSidebar karma={stats.karma} joinedAt={profile.createdAt} />}>
      <section className='celestia-card mb-4 overflow-hidden'>
        <div className='relative h-28 overflow-hidden border-b border-border/70 bg-[linear-gradient(135deg,var(--primary),var(--accent))]'>
          {profile.coverUrl ? <Image src={profile.coverUrl} alt='' fill unoptimized sizes='(max-width: 1280px) 100vw, 900px' className='object-cover' loading='eager' /> : null}
        </div>
        <div className='px-5 py-5'>
          <div className='flex flex-wrap items-start justify-between gap-5'>
            <div className='flex min-w-0 items-center gap-5'>
              <UserAvatar user={authorsById.get(profile.id) ?? profile} size='lg' className='size-32 border-4 border-card shadow-lg' />
              <div className='min-w-0'>
                <h1 className='truncate text-2xl font-bold tracking-tight text-foreground'>{profile.displayName || `u/${profile.username}`}</h1>
                <p className='mt-1 text-sm text-muted-foreground'>u/{profile.username}</p>
                {profile.bio ? <p className='mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-card-foreground'>{profile.bio}</p> : null}
              </div>
            </div>
            {sessionUser?.id !== profile.id ? <ClientProfileControls profileId={profile.id} /> : null}
          </div>
          <StatGrid className='mt-4 max-w-xl' stats={[{ label: 'Post karma', value: formatCount(stats.karma) }, { label: 'Posts', value: formatCount(stats.postCount) }, { label: 'Comments', value: formatCount(stats.commentCount) }]} />
        </div>
      </section>
      <ProfileActivityTabs activeTab={activeTab} username={profile.username}>{content}</ProfileActivityTabs>
    </ContentWithSidebar>
  );
};

const ProfileSidebar = ({ karma, joinedAt }: { karma: number; joinedAt?: string }) => <section className='celestia-card p-4'><h2 className='mb-3 text-sm font-semibold'>Profile</h2><div className='space-y-3 text-xs text-muted-foreground'><p className='flex items-center gap-2'><Trophy className='size-3 text-primary' /> {formatCount(karma)} post karma</p>{joinedAt ? <p className='flex items-center gap-2'><CakeSlice className='size-3 text-primary' /> Joined {formatRelativeTime(joinedAt)}</p> : null}</div></section>;

const ProfileEmpty = ({ icon, title, description }: { icon: typeof AtSign; title: string; description: string }) => <EmptyState icon={icon} title={title} description={description} />;

const VotedActivity = ({ posts, comments, direction, emptyFor, renderPosts, compact = false }: { posts: Awaited<ReturnType<typeof listVotedPostsByUser>>; comments: Awaited<ReturnType<typeof listVotedCommentsByUser>>; direction: 'up' | 'down'; emptyFor: string; renderPosts: (rows: Awaited<ReturnType<typeof listVotedPostsByUser>>, title?: string) => React.ReactNode; compact?: boolean }) => {
  const isUpvote = direction === 'up';
  const label = isUpvote ? 'Upvoted' : 'Downvoted';
  const Icon = isUpvote ? ArrowBigUp : ArrowBigDown;
  if (!posts.length && !comments.length) return compact ? null : <ProfileEmpty icon={Icon} title={`No ${label.toLowerCase()} content`} description={`Content u/${emptyFor} ${label.toLowerCase()} will show here.`} />;
  return <section className='space-y-3'><h2 className='flex items-center gap-2 text-sm font-semibold'><Icon className='size-4 text-primary' /> {label}</h2>{renderPosts(posts)}{comments.length ? <CommentsList comments={comments} title={`${label} comments`} activityLabel={`${label} comment on`} /> : null}</section>;
};

const CommentsList = ({ comments, title, activityLabel = 'Commented on' }: CommentsListProps & { activityLabel?: string }) => <section className='celestia-card p-4'><h2 className='mb-3 flex items-center gap-2 text-sm font-semibold'><MessageSquare className='size-4 text-primary' />{title}</h2><div className='space-y-3'>{comments.map(comment => <Link key={comment.id} href={`/post/${comment.postId}`} className='block rounded border border-border bg-muted/35 p-3 celestia-hover-surface'><p className='mb-1 truncate text-xs font-semibold text-primary'>{activityLabel} {comment.postTitle}</p><p className='text-sm leading-6 text-card-foreground'>{excerpt(comment.body)}</p><p className='mt-2 font-mono text-[11px] text-muted-foreground'>{formatRelativeTime(comment.createdAt)}</p></Link>)}</div></section>;

export const generateStaticParams = async () => (await listUsernames()).map(username => ({ username }));

export default UserPage;
