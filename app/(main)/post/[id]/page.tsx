import VoteButtons from '@/components/feed/vote-buttons';
import CommentComposer from '@/components/post/comment-composer';
import CommentThread from '@/components/post/comment-thread';
import { Separator } from '@/components/ui/separator';
import { getSessionUser } from '@/lib/auth';
import { getAuthorByID, getCommentTree, getPostByID, getPostScore, getUserVote, listTags } from '@/lib/db/queries';
import { formatRelativeTime } from '@/lib/format';
import { ArrowLeft, Clock, MessageSquare, Radio, Share2, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { UserAvatar } from '@/components/ui/user-avatar';

type Props = {
  params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const post = await getPostByID(id);
  if (!post) return notFound();

  const author = await getAuthorByID(post.authorId);
  const sessionUser = await getSessionUser();
  if (!author) return notFound();

  const score = await getPostScore(post.id);
  const userVote = await getUserVote(sessionUser?.id, 'post', post.id);

  const tags = await listTags();
  const primarySlug = post.tagSlugs[0];
  const primaryTag = primarySlug ? tags.find(t => t.slug === primarySlug) : undefined;

  const commentTree = await getCommentTree(post.id, sessionUser?.id);

  return (
    <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]'>
      <div className='min-w-0 max-w-3xl'>
        <Link
          href='/'
          className='mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
        >
          <ArrowLeft className='size-4' />
          Back to feed
        </Link>

        <article className='celestia-card overflow-hidden'>
          <div className='flex'>
            <div className='celestia-vote-rail flex min-w-[58px] flex-col items-center justify-start border-r border-border/70 px-3 py-6'>
              <VoteButtons target='post' targetID={post.id} score={score} userVote={userVote} />
            </div>
            <div className='min-w-0 flex-1 p-5 md:p-6'>
              <div className='mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                <UserAvatar user={author} size='sm' />
                <Link href={`/u/${author.username}`} className='font-medium text-card-foreground hover:text-primary'>
                  {author.displayName ?? author.username}
                </Link>
                <span className='text-muted-foreground/40'>·</span>
                <span className='flex items-center gap-1 font-mono text-[11px]'>
                  <Clock className='size-3' />
                  {formatRelativeTime(post.createdAt)}
                </span>
                {primaryTag ? (
                  <>
                    <span className='text-muted-foreground/40'>·</span>
                    <Link
                      href={`/r/${encodeURIComponent(primaryTag.slug)}`}
                      className='inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold'
                      style={{
                        backgroundColor: `${primaryTag.hashColor}18`,
                        borderColor: `${primaryTag.hashColor}38`,
                        color: primaryTag.hashColor,
                      }}
                    >
                      {primaryTag.label}
                    </Link>
                  </>
                ) : null}
              </div>
              <h1 className='text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl'>{post.title}</h1>
              {post.imageUrl ? (
                <div className='relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl border border-border/80 bg-muted'>
                  <Image
                    src={post.imageUrl}
                    alt={`Image attached to ${post.title}`}
                    fill
                    unoptimized
                    sizes='(max-width: 768px) calc(100vw - 8rem), 672px'
                    className='object-contain'
                  />
                </div>
              ) : (
                <div className='celestia-orbit-thumb mt-5 h-52 rounded-2xl border border-border/80' />
              )}
              <div className='mt-6 whitespace-pre-wrap text-base leading-8 text-muted-foreground'>{post.body}</div>
              <Separator className='my-6' />
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-3'>
                  <span className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground'>
                    <MessageSquare className='size-4' />
                    {post.commentCount}
                  </span>
                </div>
                <button type='button' className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'>
                  <Share2 className='size-4' />
                  Share
                </button>
              </div>
            </div>
          </div>
        </article>

        <section className='celestia-card mt-5 p-4 md:p-6'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
            <h2 className='text-lg font-semibold'>{post.commentCount} Comments</h2>
          </div>
          {sessionUser ? (
            <div className='mb-8'>
              <CommentComposer postID={post.id} user={sessionUser} />
            </div>
          ) : (
            <p className='mb-8 rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground'>
              <Link href='/auth/sign-in' className='font-medium text-primary hover:underline'>
                Sign in
              </Link>{' '}
              to join the discussion.
            </p>
          )}

          <CommentThread tree={commentTree} postAuthorId={post.authorId} sessionUser={sessionUser} />
        </section>
      </div>
      <aside className='hidden xl:block'>
        <div className='sticky top-20 space-y-4'>
          <section className='celestia-card p-4'>
            <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
              <Radio className='size-3 text-primary' />
              Related Posts
            </h3>
            <div className='space-y-3 text-xs text-muted-foreground'>
              <Link href='/?sort=hot' className='celestia-hover-surface block rounded-xl bg-muted/40 p-3 leading-5'>
                Explore the most active discussions right now.
              </Link>
              <Link href='/' className='celestia-hover-surface block rounded-xl bg-muted/40 p-3 leading-5'>
                Return to the latest posts from all communities.
              </Link>
            </div>
          </section>
          <section className='celestia-card p-4'>
            <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
              <Users className='size-3 text-accent' />
              Community Pulse
            </h3>
            <p className='text-xs leading-6 text-muted-foreground'>
              Keep replies threaded and specific. Deep discussions stay nested so context travels with every response.
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
};

export default Page;
