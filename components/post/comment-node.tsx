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

export const CommentNode: FC<CommentNodeProps> = ({
  node,
  postAuthorID,
  sessionUser,
  communitySlug,
  activeReplyID,
  onReplyChangeAction,
}) => {
  const isMember = useGetCommunityMember(communitySlug).data?.data?.isMember;
  const viewer = useGetProfile().data?.data;
  const isOp = node.authorID === postAuthorID;
  const isReplying = activeReplyID === node.id;
  const [hideComments, setHideComments] = useState(false);

  const hasChildren = node.children.length > 0;
  const Icon = hasChildren ? (hideComments ? PlusCircle : MinusCircle) : null;

  return (
    <li className='relative'>
      <div className='relative flex gap-3'>
        <div className='relative flex w-9 shrink-0 justify-center'>
          <UserAvatar user={node.author} />
          <span className='absolute top-10 bottom-[-0.75rem] w-px rounded-full bg-border/80 transition-colors hover:bg-primary/50' aria-hidden />
        </div>
        <div className='min-w-0 flex-1 pb-2'>
          <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <Link href={`/u/${node.author.userName}`} className='font-semibold text-card-foreground hover:text-primary'>
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
          <p className='mt-2 whitespace-pre-wrap text-sm leading-7 text-card-foreground'>{node.body}</p>
          <div className='mt-2 flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground'>
            {Icon ? (
              <button
                type='button'
                onClick={() => setHideComments(prev => !prev)}
                className='inline-flex items-center gap-1 rounded px-2 py-1 celestia-hover-surface'
                aria-label={hideComments ? 'Expand replies' : 'Collapse replies'}
              >
                <Icon className='size-4' />
                {node.children.length}
              </button>
            ) : null}
            {node.isPending ? (
              <span className='px-2 py-1 text-muted-foreground'>Sending...</span>
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
                className='inline-flex items-center gap-1 rounded px-2 py-1 celestia-hover-surface'
              >
                <CornerDownRight className='size-3.5' />
                Reply
              </button>
            ) : null}
            <button type='button' className='inline-flex items-center gap-1 rounded px-2 py-1 celestia-hover-surface'>
              <Share2 className='size-3.5' />
              Share
            </button>
          </div>

          {viewer && isReplying && (
            <div className='mt-3 border-t border-border/70 pt-3'>
              <CommentComposer postID={node.postID} user={viewer} parentID={node.id} placeholder='Write a reply...' compact />
            </div>
          )}
        </div>
      </div>

      {node.children.length > 0 && !hideComments && (
        <ul className='relative mt-2 ml-4 space-y-3 border-l border-border/80 pl-5'>
          {node.children.map(ch => (
            <CommentNode
              key={ch.id}
              node={ch}
              postAuthorID={postAuthorID}
              sessionUser={sessionUser}
              communitySlug={communitySlug}
              activeReplyID={activeReplyID}
              onReplyChangeAction={onReplyChangeAction}
            />
          ))}
        </ul>
      )}
    </li>
  );
};
