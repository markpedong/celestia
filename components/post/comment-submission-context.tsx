'use client';

import type {
  CommentSubmissionContextValue,
  EnrichedCommentNode,
  PendingCommentInput,
} from '@/lib/types';
import { createContext, useContext } from 'react';

export const CommentSubmissionContext = createContext<CommentSubmissionContextValue | null>(null);

export const useCommentSubmission = () => useContext(CommentSubmissionContext);

export const createPendingComment = ({ postID, parentID, body, author }: PendingCommentInput): EnrichedCommentNode => ({
  id: `pending-${crypto.randomUUID()}`,
  postID,
  parentID,
  body,
  createdAt: new Date().toISOString(),
  authorID: author.id,
  author,
  score: 0,
  userVote: 0,
  isPending: true,
  children: [],
});
