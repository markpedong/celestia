import { PostList } from '@/components/feed/post-list';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import { EmptyState } from '@/components/ui/empty-state';
import { StatGrid } from '@/components/ui/stat-grid';
import { ProfileActivityTabs } from '@/components/profile/profile-activity-tabs';
import { ClientProfileControls } from '@/components/auth/client-profile-controls';
import {
    batchAuthorsForIds,
    getUserByUsername,
    getUserStats,
    listCommentsByAuthor,
    listPostsByAuthor,
    listTags,
    listUsernames,
} from '@/lib/db/queries';
import { formatCount, formatRelativeTime } from '@/lib/format';
import { AtSign, CakeSlice, MessageSquare, Trophy } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ProfileMediaEditor, ProfileMediaEditMode } from '@/components/profile/profile-media-editor';
import type { CommentsListProps, UserPageProps } from '@/lib/types';

export const revalidate = 300;
export const dynamicParams = true;

const excerpt = (body: string) => {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > 180 ? `${clean.slice(0, 180)}...` : clean;
};

const UserPage = async ({ params }: UserPageProps) => {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const profile = await getUserByUsername(username);

  if (!profile) {
    notFound();
  }

  const [posts, tags, stats, comments, authorById] = await Promise.all([
    listPostsByAuthor(profile.id, 'new', undefined),
    listTags(),
    getUserStats(profile.id),
    listCommentsByAuthor(profile.id),
    batchAuthorsForIds([profile.id]),
  ]);
  const tagsMap = new Map(tags.map(tag => [tag.slug, tag]));
  const author = authorById.get(profile.id) ?? profile;

  return (
    <ContentWithSidebar
      sidebar={
        <section className='celestia-card p-4'>
          <h2 className='mb-3 text-sm font-semibold'>Profile</h2>
          <div className='space-y-3 text-xs text-muted-foreground'>
            <p className='flex items-center gap-2'>
              <Trophy className='size-3 text-primary' /> {formatCount(stats.karma)} post karma
            </p>
            {profile.createdAt ? (
              <p className='flex items-center gap-2'>
                <CakeSlice className='size-3 text-primary' /> Joined {formatRelativeTime(profile.createdAt)}
              </p>
            ) : null}
          </div>
        </section>
      }
    >
      <ProfileMediaEditMode>
        <section className='celestia-card mb-4 overflow-hidden'>
          <div className='relative h-28 overflow-hidden border-b border-border/70 bg-[linear-gradient(135deg,var(--primary),var(--accent))]'>
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
            <ProfileMediaEditor field='cover' className='right-3 bottom-3 group' />
          </div>
          <div className='px-5 py-5'>
            <div className='flex flex-wrap items-start justify-between gap-5'>
              <div className='flex min-w-0 items-center gap-5'>
                <div className='group relative shrink-0'>
                  <UserAvatar user={author} size='lg' className='size-32 border-4 border-card shadow-lg' />
                  <ProfileMediaEditor field='avatar' className='inset-0' />
                </div>
                <div className='min-w-0'>
                  <h1 className='truncate text-2xl font-bold tracking-tight text-foreground'>u/{profile.username}</h1>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <ClientProfileControls profileId={profile.id} />
              </div>
            </div>
            <StatGrid
              className='mt-4 max-w-xl'
              stats={[
                { label: 'Post karma', value: formatCount(stats.karma) },
                { label: 'Posts', value: formatCount(stats.postCount) },
                { label: 'Comments', value: formatCount(stats.commentCount) },
              ]}
            />
          </div>
        </section>
      </ProfileMediaEditMode>

      <ProfileActivityTabs
        overview={
          <div className='space-y-3'>
            {posts.length > 0 ? (
              <PostList rows={posts} authorsById={new Map([[profile.id, author]])} authorStatsById={new Map([[profile.id, stats]])} tagsBySlug={tagsMap} isSignedIn={false} />
            ) : null}
            {comments.length > 0 ? <CommentsList comments={comments} title='Recent comments' /> : null}
            {posts.length === 0 && comments.length === 0 ? (
              <EmptyState
                icon={AtSign}
                title='No activity yet'
                description={`Posts and comments from u/${profile.username} will show here.`}
              />
            ) : null}
          </div>
        }
        posts={
          posts.length > 0 ? (
            <div className='space-y-3'>
              <PostList rows={posts} authorsById={new Map([[profile.id, author]])} authorStatsById={new Map([[profile.id, stats]])} tagsBySlug={tagsMap} isSignedIn={false} />
            </div>
          ) : (
            <EmptyState
              icon={AtSign}
              title='No posts yet'
              description={`Posts from u/${profile.username} will show here.`}
            />
          )
        }
        comments={
          comments.length > 0 ? (
            <CommentsList comments={comments} title='Comments' />
          ) : (
            <EmptyState
              icon={MessageSquare}
              title='No comments yet'
              description={`Comments from u/${profile.username} will show here.`}
            />
          )
        }
      />
    </ContentWithSidebar>
  );
};

const CommentsList = ({ comments, title }: CommentsListProps) => {
  return (
    <section className='celestia-card p-4'>
      <h2 className='mb-3 flex items-center gap-2 text-sm font-semibold'>
        <MessageSquare className='size-4 text-primary' />
        {title}
      </h2>
      <div className='space-y-3'>
        {comments.map(comment => (
          <Link
            key={comment.id}
            href={`/post/${comment.postId}`}
            className='block rounded border border-border bg-muted/35 p-3 celestia-hover-surface'
          >
            <p className='mb-1 truncate text-xs font-semibold text-primary'>Commented on {comment.postTitle}</p>
            <p className='text-sm leading-6 text-card-foreground'>{excerpt(comment.body)}</p>
            <p className='mt-2 font-mono text-[11px] text-muted-foreground'>{formatRelativeTime(comment.createdAt)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export const generateStaticParams = async () => {
  const usernames = await listUsernames();
  return usernames.map(username => ({ username }));
};

export default UserPage;
