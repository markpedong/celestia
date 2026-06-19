'use client';

import { User } from '@/lib/types';
import { EnrichedCommentNode } from '@/lib/comment-tree';
import { CommentNode } from './comment-node';
import { createCommentAction } from '@/lib/actions/comments';
import { CommentSubmissionContext, createPendingComment, type PendingCommentInput } from './comment-submission-context';
import { useOptimistic, useState, useTransition } from 'react';

const CommentThread = ({
  tree,
  postAuthorId,
  sessionUser,
  children,
}: {
  tree: EnrichedCommentNode[];
  postAuthorId: string;
  sessionUser: User | null;
  children: React.ReactNode;
}) => {
  const [pending, startTransition] = useTransition();
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [optimisticTree, addOptimisticComment] = useOptimistic(
    tree,
    (currentTree, pendingComment: EnrichedCommentNode) => appendComment(currentTree, pendingComment),
  );

  const submitComment = (formData: FormData, pendingComment: PendingCommentInput) => new Promise<{ error?: string } | null>((resolve) => {
    startTransition(async () => {
      addOptimisticComment(createPendingComment(pendingComment));
      const result = await createCommentAction(null, formData);
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
            postAuthorId={postAuthorId}
            sessionUser={sessionUser}
            activeReplyId={activeReplyId}
            onReplyChange={setActiveReplyId}
          />
        ))}
      </ul>
    </CommentSubmissionContext>
  );
};

function appendComment(tree: EnrichedCommentNode[], comment: EnrichedCommentNode): EnrichedCommentNode[] {
  if (!comment.parentId) return [...tree, comment];

  for (let index = 0; index < tree.length; index += 1) {
    const node = tree[index];
    if (node.id === comment.parentId) {
      return tree.map((candidate, candidateIndex) => candidateIndex === index
        ? { ...candidate, children: [...candidate.children, comment] }
        : candidate,
      );
    }

    const children = appendComment(node.children, comment);
    if (children !== node.children) {
      return tree.map((candidate, candidateIndex) => candidateIndex === index
        ? { ...candidate, children }
        : candidate,
      );
    }
  }

  return tree;
}

export default CommentThread;
