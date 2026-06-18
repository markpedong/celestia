import VoteButtons from '@/components/feed/vote-buttons';
import CommentComposer from '@/components/post/comment-composer';
import CommentThread from '@/components/post/comment-thread';
import { Separator } from '@/components/ui/separator';
import { getSessionUser } from '@/lib/auth';
import { getAuthorByID, getCommentTree, getPostByID, getPostScore, getUserVote, listTags } from '@/lib/db/queries';
import { formatRelativeTime } from '@/lib/format';
import { UserAvatar } from '@neondatabase/auth/react';
import { ArrowLeft, Clock, MessageSquare, Share2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
    <div className='flex gap-6'>
      <div className='min-w-0 flex-1 max-w-3xl'>
        <Link
          href='/'
          className='mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
        >
          <ArrowLeft className='size-4' />
          Back to feed
        </Link>

        <article className='rounded-xl border border-border bg-card p-5 shadow-[0_0_34px_rgba(124,106,247,0.06)] md:p-6'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
            <UserAvatar user={author} size='sm' />
            <span className='font-medium text-muted-foreground'>{author.displayName ?? author.username}</span>
            <span className='text-muted-foreground/40'>·</span>
            <span className='flex items-center gap-1 font-mono text-[11px]'>
              <Clock className='size-3' />
              {formatRelativeTime(post.createdAt)}
            </span>
            </div>
            {primaryTag ? (
              <Link
                href={`/?tag=${encodeURIComponent(primaryTag.slug)}`}
                className='inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium'
                style={{
                  backgroundColor: `${primaryTag.hashColor}14`,
                  borderColor: `${primaryTag.hashColor}30`,
                  color: primaryTag.hashColor,
                }}
              >
                <span className='size-1 rounded-full shadow-[0_0_4px_currentColor]' style={{ background: primaryTag.hashColor }} />
                {primaryTag.label}
              </Link>
            ) : null}
          </div>
          <h1 className='text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl'>{post.title}</h1>
          <div className='mt-6 whitespace-pre-wrap text-base leading-8 text-muted-foreground'>{post.body}</div>
          <Separator className='my-6' />
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
              <VoteButtons target='post' targetID={post.id} score={score} userVote={userVote} />
              <span className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground'>
                <MessageSquare className='size-4' />
                {post.commentCount}
              </span>
            </div>
            <button type='button' className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground'>
              <Share2 className='size-4' />
              Share
            </button>
          </div>
        </article>

        <section className='mt-5 rounded-xl border border-border bg-card p-4 shadow-[0_0_34px_rgba(124,106,247,0.04)] md:p-6'>
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
    </div>
  );
};

export default Page;
