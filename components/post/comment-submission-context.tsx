'use client';

import type { EnrichedCommentNode } from '@/lib/comment-tree';
import type { User } from '@/lib/types';
import { createContext, useContext } from 'react';

export type PendingCommentInput = {
  postId: string;
  parentId: string | null;
  body: string;
  author: User;
};

export type CommentSubmitResult = { error?: string } | null;

type CommentSubmissionContextValue = {
  submitComment: (formData: FormData, pendingComment: PendingCommentInput) => Promise<CommentSubmitResult>;
  pending: boolean;
};

export const CommentSubmissionContext = createContext<CommentSubmissionContextValue | null>(null);

export const useCommentSubmission = () => useContext(CommentSubmissionContext);

export const createPendingComment = ({ postId, parentId, body, author }: PendingCommentInput): EnrichedCommentNode => ({
  id: `pending-${crypto.randomUUID()}`,
  postId,
  parentId,
  body,
  createdAt: new Date().toISOString(),
  authorId: author.id,
  author,
  score: 0,
  userVote: 0,
  isPending: true,
  children: [],
});
