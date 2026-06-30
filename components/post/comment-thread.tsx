'use client';

import type { FC } from 'react';
import type { CommentSubmitResult, CommentThreadProps, EnrichedCommentNode, PendingCommentInput } from '@/lib/types';
import { CommentNode } from './comment-node';
import { CommentSubmissionContext, createPendingComment } from './comment-submission-context';
import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { useCreateComment } from '@/hooks/useQueries';
import styles from './comment-thread.module.scss';

const CommentThread: FC<CommentThreadProps> = ({ tree, postAuthorID, sessionUser, communitySlug, children }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const createCommentMutation = useCreateComment();
  const [activeReplyID, setActiveReplyID] = useState<string | null>(null);
  const [optimisticTree, addOptimisticComment] = useOptimistic(
    tree,
    (currentTree, pendingComment: EnrichedCommentNode) => appendComment(currentTree, pendingComment)
  );

  const submitComment = (pendingComment: PendingCommentInput) =>
    new Promise<CommentSubmitResult>(resolve => {
      startTransition(async () => {
        addOptimisticComment(createPendingComment(pendingComment));
        const result = await createCommentMutation.mutateAsync(pendingComment);
        if (result?.ok) {
          setActiveReplyID(null);
          router.refresh();
        }
        resolve(result);
      });
    });

  return (
    <CommentSubmissionContext value={{ submitComment, pending: pending || createCommentMutation.isPending }}>
      {children}
      <CommentTree
        tree={optimisticTree}
        postAuthorID={postAuthorID}
        sessionUser={sessionUser}
        communitySlug={communitySlug}
        activeReplyID={activeReplyID}
        onReplyChangeAction={setActiveReplyID}
      />
    </CommentSubmissionContext>
  );
};

const CommentTree: FC<Omit<CommentThreadProps, 'children'> & {
  activeReplyID: string | null;
  onReplyChangeAction: (commentID: string | null) => void;
}> = ({ tree, postAuthorID, sessionUser, communitySlug, activeReplyID, onReplyChangeAction }) => (
  <ul className={styles.list}>
    {tree.map(node => (
      <CommentNode
        key={node.id}
        node={node}
        postAuthorID={postAuthorID}
        sessionUser={sessionUser}
        communitySlug={communitySlug}
        activeReplyID={activeReplyID}
        onReplyChangeAction={onReplyChangeAction}
      />
    ))}
  </ul>
);

const appendComment = (tree: EnrichedCommentNode[], comment: EnrichedCommentNode): EnrichedCommentNode[] => {
  if (!comment.parentID) return [comment, ...tree];

  for (let index = 0; index < tree.length; index += 1) {
    const node = tree[index];
    if (node.id === comment.parentID) {
      return tree.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, children: [comment, ...candidate.children] } : candidate
      );
    }

    const children = appendComment(node.children, comment);
    if (children !== node.children) {
      return tree.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, children } : candidate
      );
    }
  }

  return tree;
};

export default CommentThread;
