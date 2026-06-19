'use client';

import { EnrichedCommentNode } from '@/lib/comment-tree';
import { User } from '@/lib/types';
import { Badge } from '../ui/badge';
import { formatRelativeTime } from '@/lib/format';
import VoteButtons from '../feed/vote-buttons';
import CommentComposer from './comment-composer';
import { Clock, CornerDownRight, Share2 } from 'lucide-react';
import Link from 'next/link';

export function CommentNode({
  node,
  postAuthorId,
  sessionUser,
  activeReplyId,
  onReplyChange,
}: {
  node: EnrichedCommentNode;
  postAuthorId: string;
  sessionUser: User | null;
  activeReplyId: string | null;
  onReplyChange: (commentId: string | null) => void;
}) {
  const isOp = node.authorId === postAuthorId;
  const isReplying = activeReplyId === node.id;

  return (
    <li className='relative'>
      <div className='rounded-2xl border border-border bg-secondary/35 p-4 shadow-lg shadow-foreground/5'>
        <div className='mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <Link href={`/u/${node.author.username}`} className='font-medium text-muted-foreground hover:text-primary'>
              {node.author.displayName ?? node.author.username}
            </Link>
            {isOp ? (
              <Badge variant='secondary' className='h-5 border-primary/20 bg-primary/10 px-1.5 text-[10px] font-semibold uppercase text-primary'>
                OP
              </Badge>
            ) : null}
            <span className='text-muted-foreground/40'>·</span>
            <span className='flex items-center gap-1 font-mono text-[11px]'>
              <Clock className='size-3' />
              {formatRelativeTime(node.createdAt)}
            </span>
          </div>
          <p className='whitespace-pre-wrap text-sm leading-7 text-card-foreground'>{node.body}</p>
          <div className='mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground'>
            {node.isPending ? <span className='px-2 py-1 text-muted-foreground'>Sending…</span> : <VoteButtons target='comment' targetID={node.id} score={node.score} userVote={node.userVote} />}
            {sessionUser && !node.isPending ? (
              <button
                type='button'
                onClick={() => onReplyChange(isReplying ? null : node.id)}
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

          {sessionUser && isReplying && (
            <div className='mt-3 border-t border-border/70 pt-3'>
              <CommentComposer
                postID={node.postId}
                user={sessionUser}
                parentId={node.id}
                placeholder='Write a reply…'
                compact
              />
            </div>
          )}

          {node.children.length > 0 && (
            <ul className='mt-4 space-y-4 border-l border-primary/25 pl-4'>
              {node.children.map(ch => (
                <CommentNode
                  key={ch.id}
                  node={ch}
                  postAuthorId={postAuthorId}
                  sessionUser={sessionUser}
                  activeReplyId={activeReplyId}
                  onReplyChange={onReplyChange}
                />
              ))}
            </ul>
          )}
      </div>
    </li>
  );
}
