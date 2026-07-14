'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useGetProfile } from '@/hooks/useQueries';
import { ShareButton } from '@/components/ui/share-button';
import { ContentActionButton } from '@/components/ui/content-action-button';
import { ReportButton } from '@/components/ui/report-button';

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
      <ContentActionButton
        kind='saved'
        targetType='post'
        targetID={postID}
        className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'
      />
      <ContentActionButton
        kind='hidden'
        targetType='post'
        targetID={postID}
        className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'
      />
      {!isAuthor ? (
        <ReportButton
          targetType='post'
          targetID={postID}
          className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'
        />
      ) : null}
      <ShareButton
        path={`/post/${postID}`}
        className='inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground celestia-hover-surface'
      />
    </div>
  );
};
