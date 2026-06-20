import { EditPostForm } from '@/components/post/edit-post-form';
import { getSessionUser } from '@/lib/auth';
import { getPostByID } from '@/lib/db/queries';
import type { PostPageProps } from '@/lib/types';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function EditPostPage({ params }: PostPageProps) {
  const { id } = await params;
  const [post, user] = await Promise.all([getPostByID(id), getSessionUser()]);
  if (!post) notFound();
  if (!user) redirect('/auth/sign-in');
  if (post.authorId !== user.id) redirect(`/post/${post.id}`);

  return (
    <div className='mx-auto max-w-3xl'>
      <Link href={`/post/${post.id}`} className='mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'>
        <ArrowLeft className='size-4' /> Back to post
      </Link>
      <div className='mb-5'>
        <p className='celestia-panel-label mb-2'><Pencil className='size-3' /> Edit post</p>
        <h1 className='text-2xl font-bold tracking-tight'>Update your post</h1>
      </div>
      <EditPostForm post={post} />
    </div>
  );
}
