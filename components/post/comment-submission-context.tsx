'use client';

import type {
  CommentSubmissionContextValue,
  EnrichedCommentNode,
  PendingCommentInput,
} from '@/lib/types';
import { createContext, useContext } from 'react';

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
