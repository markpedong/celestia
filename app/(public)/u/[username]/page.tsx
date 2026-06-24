import { ClientProfileControls } from '@/components/auth/client-profile-controls';
import PostCard from '@/components/feed/post-card';
import { PostList } from '@/components/feed/post-list';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import { ProfileActivityTabs } from '@/components/profile/profile-activity-tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { StatGrid } from '@/components/ui/stat-grid';
import { UserAvatar } from '@/components/ui/user-avatar';
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
import type { CommentsListProps, FeedPostRow, UserCommentActivity, UserPageProps } from '@/lib/types';
import { ArrowBigDown, ArrowBigUp, AtSign, CakeSlice, FileText, MessageSquare, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 300;
export const dynamicParams = true;

const excerpt = (body: string) => {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > 180 ? `${clean.slice(0, 180)}...` : clean;
};

type OverviewActivity =
  | { kind: 'post' | 'upvoted-post' | 'downvoted-post'; createdAt: string; row: FeedPostRow }
  | { kind: 'comment' | 'upvoted-comment' | 'downvoted-comment'; createdAt: string; comment: UserCommentActivity };

const UserPage = async ({ params }: UserPageProps) => {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const profile = await getUserByUsername(username);
  if (!profile) notFound();

  const [tags, stats, posts, comments, upvotedPosts, upvotedComments, downvotedPosts, downvotedComments] = await Promise.all([
    listTags(),
    getUserStats(profile.id),
    listPostsByAuthor(profile.id, 'new', undefined),
    listCommentsByAuthor(profile.id),
    listVotedPostsByUser(profile.id, 1, undefined),
    listVotedCommentsByUser(profile.id, 1),
    listVotedPostsByUser(profile.id, -1, undefined),
    listVotedCommentsByUser(profile.id, -1),
  ]);
  const allRows = [...posts, ...upvotedPosts, ...downvotedPosts];
  const authorIds = [...new Set(allRows.map(({ post }) => post.authorId).concat(profile.id))];
  const [authorsById, authorStatsById] = await Promise.all([batchAuthorsForIds(authorIds), batchUserStatsForIds(authorIds)]);
  const tagsBySlug = new Map(tags.map(tag => [tag.slug, tag]));
  const hasActivity = posts.length + comments.length + upvotedPosts.length + upvotedComments.length + downvotedPosts.length + downvotedComments.length > 0;
  const overviewActivity: OverviewActivity[] = [
    ...posts.map(row => ({ kind: 'post' as const, createdAt: row.post.createdAt, row })),
    ...comments.map(comment => ({ kind: 'comment' as const, createdAt: comment.createdAt, comment })),
    ...upvotedPosts.map(row => ({ kind: 'upvoted-post' as const, createdAt: row.post.createdAt, row })),
    ...upvotedComments.map(comment => ({ kind: 'upvoted-comment' as const, createdAt: comment.createdAt, comment })),
    ...downvotedPosts.map(row => ({ kind: 'downvoted-post' as const, createdAt: row.post.createdAt, row })),
    ...downvotedComments.map(comment => ({ kind: 'downvoted-comment' as const, createdAt: comment.createdAt, comment })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const renderPosts = (rows: typeof posts, title?: string) => rows.length ? (
    <section className='space-y-3'>
      {title ? <h2 className='flex items-center gap-2 text-sm font-semibold'>{title}</h2> : null}
      <PostList rows={rows} authorsById={authorsById} authorStatsById={authorStatsById} tagsBySlug={tagsBySlug} isSignedIn={false} />
    </section>
  ) : null;

  const content = [
    hasActivity ? <OverviewActivityFeed key='overview' items={overviewActivity} authorsById={authorsById} authorStatsById={authorStatsById} tagsBySlug={tagsBySlug} isSignedIn={false} /> : <ProfileEmpty key='overview-empty' icon={AtSign} title='No activity yet' description={`Posts, comments, and votes from u/${profile.username} will show here.`} />,
    renderPosts(posts) ?? <ProfileEmpty key='posts-empty' icon={FileText} title='No posts yet' description={`Posts from u/${profile.username} will show here.`} />,
    comments.length ? <CommentsList key='comments' comments={comments} title='Comments' /> : <ProfileEmpty key='comments-empty' icon={MessageSquare} title='No comments yet' description={`Comments from u/${profile.username} will show here.`} />,
    <VotedActivity key='upvoted' posts={upvotedPosts} comments={upvotedComments} direction='up' emptyFor={profile.username} renderPosts={renderPosts} />,
    <VotedActivity key='downvoted' posts={downvotedPosts} comments={downvotedComments} direction='down' emptyFor={profile.username} renderPosts={renderPosts} />,
  ];

  return (
    <ContentWithSidebar sidebar={<ProfileSidebar karma={stats.karma} joinedAt={profile.createdAt.toISOString()} />}>
      <section className='celestia-card mb-4 overflow-hidden'>
        <div className='relative h-28 overflow-hidden border-b border-border/70 bg-[linear-gradient(135deg,var(--primary),var(--accent))]'>
          {profile.coverUrl ? <Image src={profile.coverUrl} alt='' fill unoptimized sizes='(max-width: 1280px) 100vw, 900px' className='object-cover' loading='eager' /> : null}
        </div>
        <div className='px-5 py-5'>
          <div className='flex flex-wrap items-start justify-between gap-5'>
            <div className='flex min-w-0 items-center gap-5'>
              <UserAvatar user={authorsById.get(profile.id) ?? profile} size='lg' className='size-32 border-4 border-card shadow-lg' />
              <div className='min-w-0'>
                <h1 className='truncate text-2xl font-bold tracking-tight text-foreground'>{profile.displayName || profile.username}</h1>
                <p className='mt-1 text-sm text-muted-foreground'>u/{profile.username}</p>
                {profile.bio ? <p className='mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-card-foreground'>{profile.bio}</p> : null}
              </div>
            </div>
            <ClientProfileControls profileId={profile.id} />
          </div>
          <StatGrid className='mt-4 max-w-xl' stats={[{ label: 'Post karma', value: formatCount(stats.karma) }, { label: 'Posts', value: formatCount(stats.postCount) }, { label: 'Comments', value: formatCount(stats.commentCount) }]} />
        </div>
      </section>
      <ProfileActivityTabs>{content}</ProfileActivityTabs>
    </ContentWithSidebar>
  );
};

const ProfileSidebar = ({ karma, joinedAt }: { karma: number; joinedAt?: string }) => <section className='celestia-card p-4'><h2 className='mb-3 text-sm font-semibold'>Profile</h2><div className='space-y-3 text-xs text-muted-foreground'><p className='flex items-center gap-2'><Trophy className='size-3 text-primary' /> {formatCount(karma)} post karma</p>{joinedAt ? <p className='flex items-center gap-2'><CakeSlice className='size-3 text-primary' /> Joined {formatRelativeTime(joinedAt)}</p> : null}</div></section>;

const ProfileEmpty = ({ icon, title, description }: { icon: typeof AtSign; title: string; description: string }) => <EmptyState icon={icon} title={title} description={description} />;

const OverviewActivityFeed = ({ items, authorsById, authorStatsById, tagsBySlug, isSignedIn }: { items: OverviewActivity[]; authorsById: Awaited<ReturnType<typeof batchAuthorsForIds>>; authorStatsById: Awaited<ReturnType<typeof batchUserStatsForIds>>; tagsBySlug: Map<string, Awaited<ReturnType<typeof listTags>>[number]>; isSignedIn: boolean }) => <div className='space-y-3'>{items.map(item => {
  if ('row' in item) {
    const author = authorsById.get(item.row.post.authorId);
    if (!author) return null;
    const label = item.kind === 'upvoted-post' ? 'Upvoted post' : item.kind === 'downvoted-post' ? 'Downvoted post' : null;
    return <div key={`${item.kind}-${item.row.post.id}`} className='space-y-1'>{label ? <p className='px-1 text-xs font-medium text-muted-foreground'>{label}</p> : null}<PostCard post={item.row.post} author={author} authorStats={authorStatsById.get(item.row.post.authorId) ?? { postCount: 0, commentCount: 0, karma: 0, commentKarma: 0 }} tagsBySlug={tagsBySlug} score={item.row.score} userVote={item.row.userVote} isSignedIn={isSignedIn} /></div>;
  }
  const label = item.kind === 'upvoted-comment' ? 'Upvoted comment on' : item.kind === 'downvoted-comment' ? 'Downvoted comment on' : 'Commented on';
  return <CommentActivityCard key={`${item.kind}-${item.comment.id}`} comment={item.comment} label={label} />;
})}</div>;

const VotedActivity = ({ posts, comments, direction, emptyFor, renderPosts, compact = false }: { posts: Awaited<ReturnType<typeof listVotedPostsByUser>>; comments: Awaited<ReturnType<typeof listVotedCommentsByUser>>; direction: 'up' | 'down'; emptyFor: string; renderPosts: (rows: Awaited<ReturnType<typeof listVotedPostsByUser>>, title?: string) => React.ReactNode; compact?: boolean }) => {
  const isUpvote = direction === 'up';
  const label = isUpvote ? 'Upvoted' : 'Downvoted';
  const Icon = isUpvote ? ArrowBigUp : ArrowBigDown;
  if (!posts.length && !comments.length) return compact ? null : <ProfileEmpty icon={Icon} title={`No ${label.toLowerCase()} content`} description={`Content u/${emptyFor} ${label.toLowerCase()} will show here.`} />;
  return <section className='space-y-3'><h2 className='flex items-center gap-2 text-sm font-semibold'><Icon className='size-4 text-primary' /> {label}</h2>{renderPosts(posts)}{comments.length ? <CommentsList comments={comments} title={`${label} comments`} activityLabel={`${label} comment on`} /> : null}</section>;
};

const CommentActivityCard = ({ comment, label }: { comment: UserCommentActivity; label: string }) => <Link href={`/post/${comment.postId}`} className='block rounded border border-border bg-muted/35 p-3 celestia-hover-surface'><p className='mb-1 truncate text-xs font-semibold text-primary'>{label} {comment.postTitle}</p><p className='text-sm leading-6 text-card-foreground'>{excerpt(comment.body)}</p><p className='mt-2 font-mono text-[11px] text-muted-foreground'>{formatRelativeTime(comment.createdAt)}</p></Link>;

const CommentsList = ({ comments, title, activityLabel = 'Commented on' }: CommentsListProps & { activityLabel?: string }) => <section className='celestia-card p-4'><h2 className='mb-3 flex items-center gap-2 text-sm font-semibold'><MessageSquare className='size-4 text-primary' />{title}</h2><div className='space-y-3'>{comments.map(comment => <CommentActivityCard key={comment.id} comment={comment} label={activityLabel} />)}</div></section>;

export const generateStaticParams = async () => (await listUsernames()).map(username => ({ username }));

export default UserPage;
