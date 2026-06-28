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
import styles from './comment-node.module.scss';

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
    <li className={styles.node}>
      <div className={styles.row}>
        <div className={styles.avatarRail}>
          <UserAvatar user={node.author} />
          <span className={styles.railLine} aria-hidden />
        </div>
        <div className={styles.body}>
          <div className={styles.meta}>
            <Link href={`/u/${node.author.userName}`} className={styles.author}>
              {node.author.displayName ?? node.author.userName}
            </Link>
            {isOp ? (
              <Badge
                variant='secondary'
                className={styles.opBadge}
              >
                OP
              </Badge>
            ) : null}
            <span className={styles.separator}>·</span>
            <span className={styles.timestamp}>
              <Clock className='size-3' />
              {formatTimeAgo(node.createdAt)}
            </span>
          </div>
          <p className={styles.copy}>{node.body}</p>
          <div className={styles.actions}>
            {Icon ? (
              <button
                type='button'
                onClick={() => setHideComments(prev => !prev)}
                className='celestia-inline-action'
                aria-label={hideComments ? 'Expand replies' : 'Collapse replies'}
              >
                <Icon className='size-4' />
                {node.children.length}
              </button>
            ) : null}
            {!node.isPending ? (
              <VoteButtons
                target='comment'
                targetID={node.id}
                score={node.score}
                userVote={node.userVote}
                isSignedIn={Boolean(viewer)}
              />
            ) : null}
            {viewer && isMember && !node.isPending ? (
              <button
                type='button'
                onClick={() => onReplyChangeAction(isReplying ? null : node.id)}
                className='celestia-inline-action'
              >
                <CornerDownRight className='size-3.5' />
                Reply
              </button>
            ) : null}
            <button type='button' className='celestia-inline-action'>
              <Share2 className='size-3.5' />
              Share
            </button>
          </div>

          {viewer && isReplying && (
            <div className={styles.replyForm}>
              <CommentComposer postID={node.postID} user={viewer} parentID={node.id} placeholder='Write a reply...' compact />
            </div>
          )}
        </div>
      </div>

      {node.children.length > 0 && !hideComments && (
        <ul className={styles.children}>
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
