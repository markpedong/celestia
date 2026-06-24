'use client';

import Link from 'next/link';
import { Pencil, Share2 } from 'lucide-react';
import { useGetProfile } from '@/hooks/useQueries';

export const ClientPostControls = ({ postID, authorID }: { postID: string; authorID: string }) => {
  const user = useGetProfile().data?.data;
  const isAuthor = user?.id === authorID;

  return (
    <div className='flex items-center gap-1'>
      {isAuthor ? (
        <Link
          href={`/post/${postID}/edit`}
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
  );
};
