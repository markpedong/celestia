'use client';

import type { FC } from 'react';
import { createCommentAction } from '@/lib/actions/comments';
import type { CommentComposerProps } from '@/lib/types';
import { useRouter } from 'next/navigation';
import type { FormEventHandler } from 'react';
import { useState, useTransition } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/user-avatar';
import { useCommentSubmission } from './comment-submission-context';
import { commentSchema } from '@/lib/form-schemas';
import { useZodForm } from '@/hooks/use-zod-form';
import { MAX_COMMENT_LENGTH } from '@/constants';

const CommentComposer: FC<CommentComposerProps> = ({ postID, user, compact, parentId, placeholder }) => {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const commentSubmission = useCommentSubmission();
  const { register, handleSubmit, onFormKeyDown, reset, formState: { errors, isSubmitted, isValid, touchedFields } } = useZodForm(commentSchema, { body: '' });

  const submitValid = async (fd: FormData) => {
    setError(null);
    const body = String(fd.get('body') ?? '').trim();

    if (commentSubmission) {
      const res = await commentSubmission.submitComment(fd, {
        postId: postID,
        parentId: parentId ?? null,
        body,
        author: user,
      });
      if (res?.error) setError(res.error);
      else reset();
      return;
    }

    startTransition(async () => {
      const res = await createCommentAction(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      reset();
      router.refresh();
    });
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = event => {
    const formData = new FormData(event.currentTarget);
    void handleSubmit(() => submitValid(formData))(event);
  };

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className='flex gap-3' noValidate>
      <input type='hidden' name='postId' value={postID} />
      <input type='hidden' name='parentId' value={parentId ?? ''} />
      <UserAvatar user={user} size={compact ? 'sm' : 'default'} className='mt-1 shrink-0' />
      <div className='min-w-0 flex-1 space-y-2'>
        <Textarea
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          maxLength={MAX_COMMENT_LENGTH}
          className='min-h-0 resize-y rounded border-border bg-secondary/80 text-sm leading-7 focus-visible:border-primary/40 focus-visible:ring-primary/20'
          aria-invalid={Boolean(errors.body && (touchedFields.body || isSubmitted))}
          {...register('body')}
        />
        {errors.body && (touchedFields.body || isSubmitted) ? <p className='text-xs text-destructive'>{errors.body.message}</p> : null}
        {error ? (
          <p className='text-xs text-destructive' role='alert'>
            {error}
          </p>
        ) : null}
        <Button type='submit' size='sm' disabled={pending || commentSubmission?.pending || !isValid} className='celestia-primary-action rounded'>
          {pending || commentSubmission?.pending ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  );
};

export default CommentComposer;
