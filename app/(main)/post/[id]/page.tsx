import VoteButtons from '@/components/feed/vote-buttons';
import { PostMeta } from '@/components/feed/post-meta';
import { ContentWithSidebar } from '@/components/layout/content-with-sidebar';
import CommentComposer from '@/components/post/comment-composer';
import CommentThread from '@/components/post/comment-thread';
import { PostImageGallery } from '@/components/post/post-image-gallery';
import { Separator } from '@/components/ui/separator';
import { getSessionUser } from '@/lib/auth';
import {
  getAuthorByID,
  getCommentTree,
  getPostByID,
  getPostScore,
  getUserVote,
  listPostIds,
  listTags,
} from '@/lib/db/queries';
import type { PostPageProps } from '@/lib/types';
import { MessageSquare, Pencil, Radio, Share2, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const generateStaticParams = async () => {
  const postIds = await listPostIds();
  return postIds.map(id => ({ id }));
};

const Page = async ({ params }: PostPageProps) => {
  const { id } = await params;
  const post = await getPostByID(id);
  if (!post) return notFound();

  const [author, sessionUser, score, tags] = await Promise.all([
    getAuthorByID(post.authorId),
    getSessionUser(),
    getPostScore(post.id),
    listTags(),
  ]);
  if (!author) return notFound();

  const [userVote, commentTree] = await Promise.all([
    getUserVote(sessionUser?.id, 'post', post.id),
    getCommentTree(post.id, sessionUser?.id),
  ]);
  const tagsBySlug = new Map(tags.map(tag => [tag.slug, tag]));

  return (
    <ContentWithSidebar
      contentClassName='max-w-3xl'
      sidebar={
        <>
          <section className='celestia-card p-4'>
            <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
              <Radio className='size-3 text-primary' />
              Related Posts
            </h3>
            <div className='space-y-3 text-xs text-muted-foreground'>
              <Link href='/?sort=hot' className='celestia-hover-surface block rounded bg-muted/40 p-3 leading-5'>
                Explore the most active discussions right now.
              </Link>
              <Link href='/' className='celestia-hover-surface block rounded bg-muted/40 p-3 leading-5'>
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
        </>
      }
    >
      <article className='celestia-card overflow-hidden'>
        <div className='flex'>
          <div className='celestia-vote-rail flex min-w-14.5 flex-col items-center justify-start border-r border-border/70 px-3 py-6'>
            <VoteButtons target='post' targetID={post.id} score={score} userVote={userVote} />
          </div>
          <div className='min-w-0 flex-1 p-5 md:p-6'>
            <PostMeta author={author} post={post} tagsBySlug={tagsBySlug} className='mb-4' />
            <h1 className='text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl'>{post.title}</h1>
            {post.imageUrls.length > 0 ? (
              <PostImageGallery imageUrls={post.imageUrls} title={post.title} variant='gallery' />
            ) : null}
            <div className='mt-6 whitespace-pre-wrap text-base leading-8 text-muted-foreground'>{post.body}</div>
            <Separator className='my-6' />
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground'>
                  <MessageSquare className='size-4' />
                  {post.commentCount}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                {sessionUser?.id === post.authorId ? (
                  <Link
                    href={`/post/${post.id}/edit`}
                    className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'
                  >
                    <Pencil className='size-4' /> Edit
                  </Link>
                ) : null}
                <button
                  type='button'
                  className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'
                >
                  <Share2 className='size-4' /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className='celestia-card mt-5 mb-5 p-4 md:p-6'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold'>{post.commentCount} Comments</h2>
        </div>
        <CommentThread tree={commentTree} postAuthorId={post.authorId} sessionUser={sessionUser}>
          {sessionUser ? (
            <div className='mb-8'>
              <CommentComposer postID={post.id} user={sessionUser} />
            </div>
          ) : (
            <p className='mb-8 rounded border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground'>
              <Link href='/auth/sign-in' className='font-medium text-primary hover:underline'>
                Sign in
              </Link>{' '}
              to join the discussion.
            </p>
          )}
        </CommentThread>
      </section>
    </ContentWithSidebar>
  );
};

export default Page;
