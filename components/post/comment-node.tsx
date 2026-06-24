'use client';

import { useState, type FC } from 'react';
import type { CommentNodeProps } from '@/lib/types';
import { Badge } from '../ui/badge';
import VoteButtons from '../feed/vote-buttons';
import CommentComposer from './comment-composer';
import { Clock, CornerDownRight, MinusCircle, PlusCircle, Share2 } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '../ui/user-avatar';
import { useGetCommunityMember, useGetProfile } from '@/hooks/useQueries';
import { formatTimeAgo } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export const CommentNode: FC<CommentNodeProps> = ({
  node,
  postAuthorID,
  sessionUser,
  activeReplyID,
  onReplyChangeAction,
}) => {
  const slug = usePathname().split('/').pop() ?? '';
  const isMember = useGetCommunityMember(slug).data?.data?.isMember;
  const viewer = useGetProfile().data?.data;
  const isOp = node.authorID === postAuthorID;
  const isReplying = activeReplyID === node.id;
  const [hideComments, setHideComments] = useState(false);

  const hasChildren = node.children.length > 0;
  const Icon = hasChildren ? (hideComments ? PlusCircle : MinusCircle) : null;

  return (
    <li className='relative p-4 pt-0 pl-8'>
      <div className='flex items-start gap-2'>
        <UserAvatar user={node.author} />
        <div className='flex flex-col'>
          <div className='mb-3 mt-[0.4rem] flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <Link href={`/u/${node.author.userName}`} className='font-medium text-muted-foreground hover:text-primary'>
              {node.author.displayName ?? node.author.userName}
            </Link>
            {isOp ? (
              <Badge
                variant='secondary'
                className='border-primary/20 bg-primary/10 px-1.5 text-[10px] font-semibold uppercase text-primary'
              >
                OP
              </Badge>
            ) : null}
            <span className='text-muted-foreground/40'>·</span>
            <span className='flex items-center gap-1 font-mono text-[11px]'>
              <Clock className='size-3' />
              {formatTimeAgo(node.createdAt)}
            </span>
          </div>
          <p className='whitespace-pre-wrap text-sm leading-7 text-card-foreground'>{node.body}</p>
        </div>
      </div>
      <div className='mt-3 ml-2 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground'>
        <div className='size-5 mr-1'>
          {Icon && <Icon className='size-5 cursor-pointer' onClick={() => setHideComments(prev => !prev)} />}
        </div>
        {node.isPending ? (
          <span className='px-2 py-1 text-muted-foreground'>Sending…</span>
        ) : (
          <VoteButtons
            target='comment'
            targetID={node.id}
            score={node.score}
            userVote={node.userVote}
            isSignedIn={Boolean(viewer)}
          />
        )}
        {viewer && isMember && !node.isPending ? (
          <button
            type='button'
            onClick={() => onReplyChangeAction(isReplying ? null : node.id)}
            className='inline-flex items-center gap-1 rounded-lg px-2 py-1 celestia-hover-surface'
          >
            <CornerDownRight className='size-3' />
            Reply
          </button>
        ) : null}
        <button type='button' className='inline-flex items-center gap-1 rounded-lg px-2 py-1 celestia-hover-surface'>
          <Share2 className='size-3' />
          Share
        </button>
      </div>

      {viewer && isReplying && (
        <div className='mt-3 border-t border-border/70 pt-3'>
          <CommentComposer postID={node.postID} user={viewer} parentID={node.id} placeholder='Write a reply…' compact />
        </div>
      )}

      {node.children.length > 0 && !hideComments && (
        <ul className='mt-4 space-y-4'>
          {node.children.map(ch => (
            <CommentNode
              key={ch.id}
              node={ch}
              postAuthorID={postAuthorID}
              sessionUser={sessionUser}
              activeReplyID={activeReplyID}
              onReplyChangeAction={onReplyChangeAction}
            />
          ))}
        </ul>
      )}
    </li>
  );
};
