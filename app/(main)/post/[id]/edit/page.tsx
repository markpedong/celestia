import { EditPostForm } from '@/components/post/edit-post-form';
import { getSessionUser } from '@/lib/auth';
import { getPostByID } from '@/lib/db/queries';
import type { PostPageProps } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

const EditPostPage = async ({ params }: PostPageProps) => {
  const { id } = await params;
  const [post, user] = await Promise.all([getPostByID(id), getSessionUser()]);
  if (!post) notFound();
  if (!user) redirect('/auth/sign-in');
  if (post.authorId !== user.id) redirect(`/post/${post.id}`);

  return (
    <div className='mx-auto max-w-3xl'>
      <h1 className='text-2xl font-bold tracking-tight mb-5 flex items-center gap-2'>
        <Link href={`/post/${post.id}`}>
          <ArrowLeft className='size-4' />
        </Link>
        Update your post
      </h1>
      <EditPostForm post={post} />
    </div>
  );
};

export default EditPostPage;
