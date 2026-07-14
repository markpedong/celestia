import { ClientProfileControls } from '@/components/auth/client-profile-controls';
import PostCard from '@/components/feed/post-card';
import { PostList } from '@/components/feed/post-list';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import { ProfileActivityTabs } from '@/components/profile/profile-activity-tabs';
import { ProfileManagedCommunities } from '@/components/profile/profile-managed-communities';
import { EmptyState } from '@/components/ui/empty-state';
import { StatGrid } from '@/components/ui/stat-grid';
import { listComments, listVotedCommentsByUser } from '@/lib/db/comment.queries';
import { listCommunity } from '@/lib/db/community.queries';
import { listPostsByAuthor, listVotedPostsByUser } from '@/lib/db/post.queries';
import {
    batchUserStatsForIDs,
    getUserByID,
    getUserByUserName,
    getUserStats,
    listUserNames,
} from '@/lib/db/user.queries';
import type { CommentsListProps, FeedPostRow, UserCommentActivity, UserPageProps } from '@/lib/types';
import { formatCount, formatTimeAgo } from '@/lib/utils';
import { ArrowBigDown, ArrowBigUp, AtSign, FileText, MessageSquare, Radio } from 'lucide-react';
import uniq from 'lodash/uniq';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { defaultOgImage, truncateDescription } from '@/lib/seo';
import { getCurrentUserID } from '@/lib/auth';

export const dynamicParams = true;

export const generateStaticParams = async () => {
  const userNames = await listUserNames();
  return userNames.map(username => ({ username }));
};

export const generateMetadata = async ({ params }: UserPageProps): Promise<Metadata> => {
  const { username: rawUserName } = await params;
  const userName = decodeURIComponent(rawUserName);
  const profile = await getUserByUserName(userName);

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  const displayName = profile.displayName || profile.userName;
  const title = `${displayName} Profile`;
  const description = truncateDescription(profile.bio || `See posts, comments, votes, and community activity from u/${profile.userName} on Celestia.`);
  const image = profile.coverUrl || profile.avatarUrl || defaultOgImage;

  return {
    title,
    description,
    alternates: {
      canonical: `/u/${profile.userName}`,
    },
    openGraph: {
      title,
      description,
      url: `/u/${profile.userName}`,
      images: [{ url: image, alt: `${displayName} profile on Celestia` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
};

const excerpt = (body: string) => {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > 180 ? `${clean.slice(0, 180)}...` : clean;
};

type OverviewActivity =
  | { kind: 'post' | 'upvoted-post' | 'downvoted-post'; createdAt: string; row: FeedPostRow }
  | { kind: 'comment' | 'upvoted-comment' | 'downvoted-comment'; createdAt: string; comment: UserCommentActivity };

const UserPage = async ({ params }: UserPageProps) => {
  const { username: rawUserName } = await params;
  const userName = decodeURIComponent(rawUserName);
  const profile = await getUserByUserName(userName);
  if (!profile) notFound();
  const viewerID = await getCurrentUserID();

  const [tags, stats, posts, comments, upvotedPosts, upvotedComments, downvotedPosts, downvotedComments] =
    await Promise.all([
      listCommunity(),
      getUserStats(profile.id),
      listPostsByAuthor(profile.id, 'new', viewerID),
      listComments({ authorID: profile.id }),
      listVotedPostsByUser(profile.id, 1, viewerID),
      listVotedCommentsByUser(profile.id, 1),
      listVotedPostsByUser(profile.id, -1, viewerID),
      listVotedCommentsByUser(profile.id, -1),
    ]);
  const allRows = [...posts, ...upvotedPosts, ...downvotedPosts];
  const authorIDs = uniq(allRows.map(({ post }) => post.authorID).concat(profile.id));
  const [authors, authorStatsByID] = await Promise.all([
    Promise.all(authorIDs.map(getUserByID)),
    batchUserStatsForIDs(authorIDs),
  ]);
  const authorsByID = new Map(authors.flatMap(author => (author ? [[author.id, author] as const] : [])));
  const tagsBySlug = new Map(tags.map(tag => [tag.slug, tag]));
  const hasActivity =
    posts.length +
      comments.length +
      upvotedPosts.length +
      upvotedComments.length +
      downvotedPosts.length +
      downvotedComments.length >
    0;
  const overviewActivity: OverviewActivity[] = [
    ...posts.map(row => ({ kind: 'post' as const, createdAt: row.post.createdAt, row })),
    ...comments.map(comment => ({ kind: 'comment' as const, createdAt: comment.createdAt, comment })),
    ...upvotedPosts.map(row => ({ kind: 'upvoted-post' as const, createdAt: row.post.createdAt, row })),
    ...upvotedComments.map(comment => ({ kind: 'upvoted-comment' as const, createdAt: comment.createdAt, comment })),
    ...downvotedPosts.map(row => ({ kind: 'downvoted-post' as const, createdAt: row.post.createdAt, row })),
    ...downvotedComments.map(comment => ({
      kind: 'downvoted-comment' as const,
      createdAt: comment.createdAt,
      comment,
    })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const renderPosts = (rows: typeof posts, title?: string) =>
    rows.length ? (
      <section className='space-y-3'>
        {title ? <h2 className='flex items-center gap-2 text-sm font-semibold'>{title}</h2> : null}
        <PostList
          rows={rows}
          authorsByID={authorsByID}
          authorStatsByID={authorStatsByID}
          tagsBySlug={tagsBySlug}
          isSignedIn={Boolean(viewerID)}
        />
      </section>
    ) : null;

  const content = [
    hasActivity ? (
      <OverviewActivityFeed
        key='overview'
        items={overviewActivity}
        authorsByID={authorsByID}
        authorStatsByID={authorStatsByID}
        tagsBySlug={tagsBySlug}
        isSignedIn={Boolean(viewerID)}
      />
    ) : (
      <ProfileEmpty
        key='overview-empty'
        icon={AtSign}
        title='No activity yet'
        description={`Posts, comments, and votes from u/${profile.userName} will show here.`}
      />
    ),
    renderPosts(posts) ?? (
      <ProfileEmpty
        key='posts-empty'
        icon={FileText}
        title='No posts yet'
        description={`Posts from u/${profile.userName} will show here.`}
      />
    ),
    comments.length ? (
      <CommentsList key='comments' comments={comments} title='Comments' />
    ) : (
      <ProfileEmpty
        key='comments-empty'
        icon={MessageSquare}
        title='No comments yet'
        description={`Comments from u/${profile.userName} will show here.`}
      />
    ),
    <VotedActivity
      key='upvoted'
      posts={upvotedPosts}
      comments={upvotedComments}
      direction='up'
      emptyFor={profile.userName}
      renderPosts={renderPosts}
    />,
    <VotedActivity
      key='downvoted'
      posts={downvotedPosts}
      comments={downvotedComments}
      direction='down'
      emptyFor={profile.userName}
      renderPosts={renderPosts}
    />,
  ];

  return (
    <ContentWithSidebar
      sidebar={
        <ProfileSidebar
          profile={profile}
          karma={stats.karma}
          contributions={stats.postCount + stats.commentCount}
          joinedAt={profile.createdAt instanceof Date ? profile.createdAt.toISOString() : String(profile.createdAt)}
        />
      }
    >
      <section className='celestia-card relative mb-5'>
        <div className='relative min-h-52 overflow-hidden bg-[linear-gradient(135deg,var(--primary),var(--accent))] md:min-h-64'>
          {profile.coverUrl ? (
            <Image
              src={profile.coverUrl}
              alt=''
              fill
              unoptimized
              sizes='(max-width: 1280px) 100vw, 900px'
              className='object-cover'
              loading='eager'
            />
          ) : null}
          <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,20,0.08)_0%,rgba(5,8,20,0.78)_100%)]' />
          <div className='absolute inset-x-0 bottom-0 min-w-0 p-5 text-white md:p-7'>
            <p className='celestia-panel-label mb-2 text-white/70'>
              <Radio className='size-3' /> Profile signal
            </p>
            <h1 className='truncate text-3xl font-black tracking-tight md:text-5xl'>
              {profile.displayName || profile.userName}
            </h1>
            <p className='mt-1 font-mono text-sm text-white/75'>u/{profile.userName}</p>
          </div>
        </div>
        <div className='relative grid gap-5 border-t border-border/70 p-5 pt-16 md:p-6 md:pt-6'>
          <div className='absolute right-5 -top-16 z-20 size-24 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-2xl ring-1 ring-white/10 md:right-7 md:-top-28 md:size-32'>
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl ?? ''}
                alt={`${profile.displayName || profile.userName} profile picture`}
                width={128}
                height={128}
                className='size-full object-cover'
                unoptimized
              />
            ) : (
              <span className='grid size-full place-items-center bg-primary/15 text-3xl font-black text-primary md:text-5xl'>
                {(profile.displayName || profile.userName).slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className='min-w-0'>
            {profile.bio ? (
              <p className='max-w-2xl whitespace-pre-wrap text-sm leading-6 text-card-foreground'>{profile.bio}</p>
            ) : (
              <p className='text-sm leading-6 text-muted-foreground wrap-break-word'>
                This profile has not added a bio yet.
              </p>
            )}
          </div>
        </div>
        <div className='px-5 pb-5 md:px-6 md:pb-6'>
          <StatGrid
            stats={[
              { label: 'Post karma', value: formatCount(stats.karma) },
              { label: 'Posts', value: formatCount(stats.postCount) },
              { label: 'Comments', value: formatCount(stats.commentCount) },
            ]}
          />
        </div>
      </section>
      <ProfileActivityTabs>{content}</ProfileActivityTabs>
    </ContentWithSidebar>
  );
};

const ProfileSidebar = ({
  profile,
  karma,
  contributions,
  joinedAt,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getUserByUserName>>>;
  karma: number;
  contributions: number;
  joinedAt?: string;
}) => (
  <div className='space-y-4'>
    <section className='celestia-card overflow-hidden'>
      <div className='h-1.5 bg-[linear-gradient(90deg,var(--primary),var(--accent))]' />
      <div className='p-4'>
        <div className='mb-4'>
          <div className='min-w-0'>
            <h2 className='truncate text-lg font-bold leading-6 tracking-tight text-card-foreground'>
              {profile.displayName || profile.userName}
            </h2>
            <p className='truncate font-mono text-xs text-muted-foreground'>u/{profile.userName}</p>
          </div>
        </div>

        <div className='space-y-4'>
          <ClientProfileControls profile={profile} />

          <div className='grid grid-cols-2 gap-2'>
            <div className='rounded border border-border bg-muted/30 p-3'>
              <div className='font-mono text-base font-bold leading-5 text-card-foreground'>{formatCount(karma)}</div>
              <div className='mt-1 text-xs leading-4 text-muted-foreground'>Karma</div>
            </div>
            <div className='rounded border border-border bg-muted/30 p-3'>
              <div className='font-mono text-base font-bold leading-5 text-card-foreground'>{formatCount(contributions)}</div>
              <div className='mt-1 text-xs leading-4 text-muted-foreground'>Contributions</div>
            </div>
            {joinedAt ? (
              <div className='col-span-2 rounded border border-border bg-muted/30 p-3'>
                <div className='font-mono text-base font-bold leading-5 text-card-foreground'>{formatTimeAgo(joinedAt)}</div>
                <div className='mt-1 text-xs leading-4 text-muted-foreground'>Celestia Age</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>

    <ProfileManagedCommunities profileID={profile.id} />
  </div>
);

const ProfileEmpty = ({ icon, title, description }: { icon: typeof AtSign; title: string; description: string }) => (
  <EmptyState icon={icon} title={title} description={description} />
);

const OverviewActivityFeed = ({
  items,
  authorsByID,
  authorStatsByID,
  tagsBySlug,
  isSignedIn,
}: {
  items: OverviewActivity[];
  authorsByID: Map<string, NonNullable<Awaited<ReturnType<typeof getUserByID>>>>;
  authorStatsByID: Awaited<ReturnType<typeof batchUserStatsForIDs>>;
  tagsBySlug: Map<string, Awaited<ReturnType<typeof listCommunity>>[number]>;
  isSignedIn: boolean;
}) => (
  <div className='space-y-3'>
    {items.map(item => {
      if ('row' in item) {
        const author = authorsByID.get(item.row.post.authorID);
        if (!author) return null;
        const label =
          item.kind === 'upvoted-post' ? 'Upvoted post' : item.kind === 'downvoted-post' ? 'Downvoted post' : null;
        return (
          <div key={`${item.kind}-${item.row.post.id}`} className='space-y-1'>
            {label ? <p className='px-1 text-xs font-medium text-muted-foreground'>{label}</p> : null}
            <PostCard
              post={item.row.post}
              author={author}
              authorStats={
                authorStatsByID.get(item.row.post.authorID) ?? {
                  postCount: 0,
                  commentCount: 0,
                  karma: 0,
                  commentKarma: 0,
                }
              }
              tagsBySlug={tagsBySlug}
              score={item.row.score}
              userVote={item.row.userVote}
              isSignedIn={isSignedIn}
            />
          </div>
        );
      }
      const label =
        item.kind === 'upvoted-comment'
          ? 'Upvoted comment on'
          : item.kind === 'downvoted-comment'
            ? 'Downvoted comment on'
            : 'Commented on';
      return <CommentActivityCard key={`${item.kind}-${item.comment.id}`} comment={item.comment} label={label} />;
    })}
  </div>
);

const VotedActivity = ({
  posts,
  comments,
  direction,
  emptyFor,
  renderPosts,
  compact = false,
}: {
  posts: Awaited<ReturnType<typeof listVotedPostsByUser>>;
  comments: Awaited<ReturnType<typeof listVotedCommentsByUser>>;
  direction: 'up' | 'down';
  emptyFor: string;
  renderPosts: (rows: Awaited<ReturnType<typeof listVotedPostsByUser>>, title?: string) => React.ReactNode;
  compact?: boolean;
}) => {
  const isUpvote = direction === 'up';
  const label = isUpvote ? 'Upvoted' : 'Downvoted';
  const Icon = isUpvote ? ArrowBigUp : ArrowBigDown;
  if (!posts.length && !comments.length)
    return compact ? null : (
      <ProfileEmpty
        icon={Icon}
        title={`No ${label.toLowerCase()} content`}
        description={`Content u/${emptyFor} ${label.toLowerCase()} will show here.`}
      />
    );
  return (
    <section className='space-y-3'>
      <h2 className='flex items-center gap-2 text-sm font-semibold'>
        <Icon className='size-4 text-primary' /> {label}
      </h2>
      {renderPosts(posts)}
      {comments.length ? (
        <CommentsList comments={comments} title={`${label} comments`} activityLabel={`${label} comment on`} />
      ) : null}
    </section>
  );
};

const CommentActivityCard = ({ comment, label }: { comment: UserCommentActivity; label: string }) => (
  <Link
    href={`/post/${comment.postID}`}
    className='block rounded border border-border bg-muted/35 p-3 celestia-hover-surface'
  >
    <p className='mb-1 truncate text-xs font-semibold text-primary'>
      {label} {comment.postTitle}
    </p>
    <p className='text-sm leading-6 text-card-foreground'>{excerpt(comment.body)}</p>
    <p className='mt-2 font-mono text-[11px] text-muted-foreground'>{formatTimeAgo(comment.createdAt)}</p>
  </Link>
);

const CommentsList = ({
  comments,
  title,
  activityLabel = 'Commented on',
}: CommentsListProps & { activityLabel?: string }) => (
  <section className='celestia-card p-4'>
    <h2 className='mb-3 flex items-center gap-2 text-sm font-semibold'>
      <MessageSquare className='size-4 text-primary' />
      {title}
    </h2>
    <div className='space-y-3'>
      {comments.map(comment => (
        <CommentActivityCard key={comment.id} comment={comment} label={activityLabel} />
      ))}
    </div>
  </section>
);

export default UserPage;
