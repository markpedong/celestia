'use client';

import type { FC } from 'react';
import type { CommentSubmitResult, CommentThreadProps, EnrichedCommentNode, PendingCommentInput } from '@/lib/types';
import { CommentNode } from './comment-node';
import { createCommentAction } from '@/lib/actions/comments';
import { CommentSubmissionContext, createPendingComment } from './comment-submission-context';
import { useOptimistic, useState, useTransition } from 'react';

const CommentThread: FC<CommentThreadProps> = ({ tree, postAuthorID, sessionUser, children }) => {
  const [pending, startTransition] = useTransition();
  const [activeReplyID, setActiveReplyID] = useState<string | null>(null);
  const [optimisticTree, addOptimisticComment] = useOptimistic(
    tree,
    (currentTree, pendingComment: EnrichedCommentNode) => appendComment(currentTree, pendingComment)
  );

  const submitComment = (pendingComment: PendingCommentInput) =>
    new Promise<CommentSubmitResult>(resolve => {
      startTransition(async () => {
        const result = await createCommentAction(pendingComment);
        if (result?.ok) addOptimisticComment(createPendingComment(pendingComment));
        resolve(result);
      });
    });

  return (
    <CommentSubmissionContext value={{ submitComment, pending }}>
      {children}
      <ul className='space-y-4'>
        {optimisticTree.map(node => (
          <CommentNode
            key={node.id}
            node={node}
            postAuthorID={postAuthorID}
            sessionUser={sessionUser}
            activeReplyID={activeReplyID}
            onReplyChange={setActiveReplyID}
          />
        ))}
      </ul>
    </CommentSubmissionContext>
  );
};

const appendComment = (tree: EnrichedCommentNode[], comment: EnrichedCommentNode): EnrichedCommentNode[] => {
  if (!comment.parentID) return [...tree, comment];

  for (let index = 0; index < tree.length; index += 1) {
    const node = tree[index];
    if (node.id === comment.parentID) {
      return tree.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, children: [...candidate.children, comment] } : candidate
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
