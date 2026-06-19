import PostCard from '@/components/feed/post-card';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth';
import { batchAuthorsForIds, getUserByUsername, getUserStats, listCommentsByAuthor, listPostsByAuthor, listTags } from '@/lib/db/queries';
import { formatCount, formatRelativeTime } from '@/lib/format';
import { AtSign, CakeSlice, MessageSquare, Plus, Shield, Trophy } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ username: string }>;
};

const excerpt = (body: string) => {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > 180 ? `${clean.slice(0, 180)}...` : clean;
};

export default async function UserPage({ params }: Props) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const profile = await getUserByUsername(username);

  if (!profile) {
    notFound();
  }

  const sessionUser = await getSessionUser();
  const isSelf = sessionUser?.id === profile.id;
  const [posts, tags, stats, comments] = await Promise.all([
    listPostsByAuthor(profile.id, 'new', sessionUser?.id),
    listTags(),
    getUserStats(profile.id),
    listCommentsByAuthor(profile.id),
  ]);
  const tagsMap = new Map(tags.map(tag => [tag.slug, tag]));
  const authorById = await batchAuthorsForIds([profile.id]);
  const author = authorById.get(profile.id) ?? profile;

  return (
    <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]'>
      <div className='min-w-0'>
        <section className='celestia-card mb-4 overflow-hidden'>
          <div className='h-24 border-b border-border/70 bg-[linear-gradient(135deg,var(--primary),var(--accent))]' />
          <div className='px-5 pb-5'>
            <div className='flex flex-wrap items-end justify-between gap-4'>
              <div className='-mt-8 flex min-w-0 items-end gap-3'>
                <span className='grid size-16 shrink-0 place-items-center rounded-full border-4 border-card bg-primary text-2xl font-black text-primary-foreground shadow-lg'>
                  {profile.username.slice(0, 1).toUpperCase()}
                </span>
                <div className='min-w-0 pb-1'>
                  <p className='text-sm font-semibold text-muted-foreground'>u/{profile.username}</p>
                  <h1 className='truncate text-2xl font-bold tracking-tight text-foreground'>
                    {isSelf ? 'Your profile' : profile.username}
                  </h1>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {isSelf ? (
                  <Button asChild size='sm' className='celestia-primary-action rounded-full'>
                    <Link href='/submit'>
                      <Plus className='size-3.5' />
                      New Post
                    </Link>
                  </Button>
                ) : (
                  <Button variant='outline' size='sm' className='rounded-full'>
                    <AtSign className='size-3.5' />
                    Follow
                  </Button>
                )}
              </div>
            </div>
            <div className='mt-4 grid max-w-xl grid-cols-3 gap-2 text-sm'>
              <Stat label='Post karma' value={formatCount(stats.karma)} />
              <Stat label='Posts' value={formatCount(stats.postCount)} />
              <Stat label='Comments' value={formatCount(stats.commentCount)} />
            </div>
          </div>
        </section>

        <div className='mb-4 flex border-b border-border/80 text-sm font-semibold'>
          <span className='border-b-2 border-primary px-4 py-2.5 text-primary'>Overview</span>
          <span className='px-4 py-2.5 text-muted-foreground'>Posts</span>
          <span className='px-4 py-2.5 text-muted-foreground'>Comments</span>
        </div>

        <div className='space-y-3'>
          {posts.map(row => (
            <PostCard
              key={row.post.id}
              post={row.post}
              author={author}
              tagsBySlug={tagsMap}
              score={row.score}
              userVote={row.userVote}
            />
          ))}

          {comments.length > 0 ? (
            <section className='celestia-card p-4'>
              <h2 className='mb-3 flex items-center gap-2 text-sm font-semibold'>
                <MessageSquare className='size-4 text-primary' />
                Recent comments
              </h2>
              <div className='space-y-3'>
                {comments.map(comment => (
                  <Link key={comment.id} href={`/post/${comment.postId}`} className='block rounded-xl border border-border bg-muted/35 p-3 celestia-hover-surface'>
                    <p className='mb-1 truncate text-xs font-semibold text-primary'>Commented on {comment.postTitle}</p>
                    <p className='text-sm leading-6 text-card-foreground'>{excerpt(comment.body)}</p>
                    <p className='mt-2 font-mono text-[11px] text-muted-foreground'>{formatRelativeTime(comment.createdAt)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {posts.length === 0 && comments.length === 0 ? (
            <div className='celestia-card px-6 py-16 text-center'>
              <AtSign className='mx-auto mb-3 size-8 text-primary' />
              <h2 className='text-base font-semibold'>No activity yet</h2>
              <p className='mt-2 text-sm text-muted-foreground'>Posts and comments from u/{profile.username} will show here.</p>
            </div>
          ) : null}
        </div>
      </div>

      <aside className='hidden xl:block'>
        <div className='sticky top-20 space-y-4'>
          <section className='celestia-card p-4'>
            <h2 className='mb-3 text-sm font-semibold'>Profile</h2>
            <div className='space-y-3 text-xs text-muted-foreground'>
              <p className='flex items-center gap-2'><Trophy className='size-3 text-primary' /> {formatCount(stats.karma)} post karma</p>
              {profile.createdAt ? (
                <p className='flex items-center gap-2'><CakeSlice className='size-3 text-primary' /> Joined {formatRelativeTime(profile.createdAt)}</p>
              ) : null}
              {isSelf ? (
                <p className='flex items-center gap-2'><Shield className='size-3 text-primary' /> This is your public profile</p>
              ) : null}
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
