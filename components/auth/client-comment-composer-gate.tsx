'use client';

import Link from 'next/link';
import type { User } from '@/lib/types';
import CommentComposer from '@/components/post/comment-composer';
import { useSession } from '@/hooks/useSession';

const toAppUser = (id: string, email: string | undefined, metadata: Record<string, unknown>): User => ({
  id,
  username: (typeof metadata.username === 'string' && metadata.username) || email?.split('@')[0] || 'user',
  displayName:
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    undefined,
  avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined,
});

export const ClientCommentComposerGate = ({ postId }: { postId: string }) => {
  const { user: authUser } = useSession();
  const user = authUser ? toAppUser(authUser.id, authUser.email, authUser.user_metadata) : null;

  if (user) return <div className='mb-8'><CommentComposer postID={postId} user={user} /></div>;

  return (
    <p className='mb-8 rounded border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground'>
      <Link href='/auth/sign-in' className='font-medium text-primary hover:underline'>Sign in</Link> to join the discussion.
    </p>
  );
};
