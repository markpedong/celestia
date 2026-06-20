'use client';

import type { FC } from 'react';
import { createCommentAction } from '@/lib/actions/comments';
import type { CommentComposerProps } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/user-avatar';
import { useCommentSubmission } from './comment-submission-context';

const CommentComposer: FC<CommentComposerProps> = ({ postID, user, compact, parentId, placeholder }: CommentComposerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const commentSubmission = useCommentSubmission();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = String(fd.get('body') ?? '').trim();

    if (commentSubmission) {
      const res = await commentSubmission.submitComment(fd, {
        postId: postID,
        parentId: parentId ?? null,
        body,
        author: user,
      });
      if (res?.error) setError(res.error);
      else form.reset();
      return;
    }

    startTransition(async () => {
      const res = await createCommentAction(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      form.reset();
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className='flex gap-3'>
      <input type='hidden' name='postId' value={postID} />
      <input type='hidden' name='parentId' value={parentId ?? ''} />
      <UserAvatar user={user} size={compact ? 'sm' : 'default'} className='mt-1 shrink-0' />
      <div className='min-w-0 flex-1 space-y-2'>
        <Textarea
          name='body'
          required
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className='min-h-0 resize-y rounded border-border bg-secondary/80 text-sm leading-7 focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
        {error ? (
          <p className='text-xs text-destructive' role='alert'>
            {error}
          </p>
        ) : null}
        <Button type='submit' size='sm' disabled={pending || commentSubmission?.pending} className='celestia-primary-action rounded'>
          {pending || commentSubmission?.pending ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  );
};

export default CommentComposer;
