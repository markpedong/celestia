'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import CommentComposer from '@/components/post/comment-composer';

const supabase = createSupabaseBrowserClient();

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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? toAppUser(data.user.id, data.user.email, data.user.user_metadata) : null);
    };

    void loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => void loadUser());
    return () => subscription.unsubscribe();
  }, []);

  if (user) return <div className='mb-8'><CommentComposer postID={postId} user={user} /></div>;

  return (
    <p className='mb-8 rounded border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground'>
      <Link href='/auth/sign-in' className='font-medium text-primary hover:underline'>Sign in</Link> to join the discussion.
    </p>
  );
};
