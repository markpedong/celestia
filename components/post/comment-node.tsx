'use client';

import { useState, type FC, type PointerEvent } from 'react';
import type { CommentNodeProps } from '@/lib/types';
import { Badge } from '../ui/badge';
import VoteButtons from '../feed/vote-buttons';
import CommentComposer from './comment-composer';
import { Clock, CornerDownRight, MinusCircle, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import classNames from 'classnames';
import Link from 'next/link';
import { UserAvatar } from '../ui/user-avatar';
import { useDeleteComment, useGetCommunityMember, useGetProfile, useUpdateComment } from '@/hooks/useQueries';
import { formatTimeAgo } from '@/lib/utils';
import styles from './comment-node.module.scss';
import { ShareButton } from '@/components/ui/share-button';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MAX_COMMENT_LENGTH } from '@/constants';
import { ContentActionButton } from '@/components/ui/content-action-button';
import { ReportButton } from '@/components/ui/report-button';

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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.body);
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const isAuthor = viewer?.id === node.authorID;

  const hasChildren = node.children.length > 0;
  const Icon = hasChildren ? (hideComments ? PlusCircle : MinusCircle) : null;
  const toggleReplies = () => setHideComments(prev => !prev);
  const toggleRepliesOnPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    toggleReplies();
  };

  return (
    <li
      id={`comment-${node.id}`}
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
          {editing ? (
            <form
              className='mt-2 space-y-2'
              onSubmit={event => {
                event.preventDefault();
                const body = draft.trim();
                if (!body) return;
                updateComment.mutate({ commentID: node.id, body }, {
                  onSuccess: response => {
                    if (response.success) setEditing(false);
                  },
                });
              }}
            >
              <Textarea
                value={draft}
                maxLength={MAX_COMMENT_LENGTH}
                rows={3}
                onChange={event => setDraft(event.target.value)}
                aria-label='Edit comment'
              />
              <div className='flex justify-end gap-2'>
                <Button type='button' size='sm' variant='outline' onClick={() => {
                  setDraft(node.body);
                  setEditing(false);
                }}>
                  Cancel
                </Button>
                <Button type='submit' size='sm' disabled={!draft.trim()} isLoading={updateComment.isPending}>
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <p className={styles.copy}>{node.deletedAt ? '[deleted]' : node.body}</p>
          )}
          {node.editedAt && !node.deletedAt ? <span className='text-[11px] text-muted-foreground'>(edited)</span> : null}
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
          {!node.isPending && !node.deletedAt ? (
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
          {isAuthor && !node.isPending && !node.deletedAt ? (
            <>
              <button type='button' className='celestia-inline-action' onClick={() => setEditing(true)}>
                <Pencil className='size-3.5' /> Edit
              </button>
              <button
                type='button'
                className='celestia-inline-action text-destructive'
                disabled={deleteComment.isPending}
                onClick={() => {
                  if (window.confirm('Delete this comment? Its replies will remain visible.')) deleteComment.mutate(node.id);
                }}
              >
                <Trash2 className='size-3.5' /> Delete
              </button>
            </>
          ) : null}
          {!node.isPending && !node.deletedAt ? (
            <ContentActionButton
              kind='saved'
              targetType='comment'
              targetID={node.id}
              className='celestia-inline-action'
            />
          ) : null}
          {!isAuthor && !node.isPending && !node.deletedAt ? (
            <ReportButton targetType='comment' targetID={node.id} className='celestia-inline-action' />
          ) : null}
          <ShareButton path={`/post/${node.postID}#comment-${node.id}`} className='celestia-inline-action' />
        </div>
        <div className={styles.replies}>
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
        </div>
      </div>
    </li>
  );
};
