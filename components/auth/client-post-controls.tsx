'use client';

import Link from 'next/link';
import { Pencil, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export const ClientPostControls = ({ postId, authorId }: { postId: string; authorId: string }) => {
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthor(data.user?.id === authorId);
    };

    void loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => void loadUser());
    return () => subscription.unsubscribe();
  }, [authorId]);

  return (
    <div className='flex items-center gap-1'>
      {isAuthor ? (
        <Link href={`/post/${postId}/edit`} className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'>
          <Pencil className='size-4' /> Edit
        </Link>
      ) : null}
      <button type='button' className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'>
        <Share2 className='size-4' /> Share
      </button>
    </div>
  );
};
