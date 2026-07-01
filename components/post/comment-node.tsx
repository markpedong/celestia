'use client';

import { useState, type FC, type PointerEvent } from 'react';
import type { CommentNodeProps } from '@/lib/types';
import { Badge } from '../ui/badge';
import VoteButtons from '../feed/vote-buttons';
import CommentComposer from './comment-composer';
import { Clock, CornerDownRight, MinusCircle, PlusCircle, Share2 } from 'lucide-react';
import classNames from 'classnames';
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
  const toggleReplies = () => setHideComments(prev => !prev);
  const toggleRepliesOnPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    toggleReplies();
  };

  return (
    <li
      className={classNames(styles.node, {
        [styles.hasChildren]: hasChildren,
        [styles.isCollapsed]: hideComments,
      })}
    >
      <div className={styles.row}>
        <div className={styles.avatarRail}>
          <UserAvatar user={node.author} />
        </div>
        <div className={styles.body}>
          <div className={styles.meta}>
            <Link href={`/u/${node.author.userName}`} className={styles.author}>
              {node.author.displayName ?? node.author.userName}
            </Link>
            {isOp ? (
              <Badge variant='secondary' className={styles.opBadge}>
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
        </div>
        {Icon ? (
          <button
            type='button'
            onClick={event => {
              if (event.detail === 0) toggleReplies();
            }}
            onPointerDown={toggleRepliesOnPointerDown}
            className={styles.threadToggle}
            aria-label={hideComments ? 'Expand replies' : 'Collapse replies'}
          >
            <Icon className='size-4' />
          </button>
        ) : null}
        <div className={styles.footer}>
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
        <div className={styles.replies}>
          {viewer && isReplying && (
            <div className={styles.replyForm}>
              <CommentComposer
                postID={node.postID}
                user={viewer}
                parentID={node.id}
                placeholder='Write a reply...'
                compact
              />
            </div>
          )}

          {hasChildren ? (
            <>
              {hideComments ? (
                <button
                  type='button'
                  onClick={toggleReplies}
                  className={styles.showReplies}
                  aria-label='Expand replies'
                >
                  Show {node.children.length} {node.children.length === 1 ? 'reply' : 'replies'}
                </button>
              ) : null}
              <ul className={hideComments ? styles.childrenHidden : styles.children}>
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
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
};
