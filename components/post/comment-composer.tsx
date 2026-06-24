'use client';

import type { FC } from 'react';
import { createCommentAction } from '@/lib/actions/comments';
import type { CommentComposerProps } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/user-avatar';
import { useCommentSubmission } from './comment-submission-context';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';
import { MAX_COMMENT_LENGTH } from '@/constants';

const CommentComposer: FC<CommentComposerProps> = ({ postID, user, compact, parentID, placeholder }) => {
  const { commentSchema } = useFormSchema();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const commentSubmission = useCommentSubmission();
  const { register, handleSubmit, onFormKeyDown, reset, formState: { errors, isSubmitted, isValid, touchedFields } } = useFormValidate({
    schema: commentSchema,
    defaultValues: { body: '' },
  });

  const onSubmit = async ({ body }: { body: string }) => {
    const pendingComment = { postID: postID, parentID: parentID ?? null, body: body.trim(), author: user };

    if (commentSubmission) {
      const res = await commentSubmission.submitComment(pendingComment);
      if (res?.error) toast.error(res.error);
      else reset();
      return;
    }

    startTransition(async () => {
      const res = await createCommentAction(pendingComment);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      reset();
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onFormKeyDown} className='flex gap-3' noValidate>
      <UserAvatar user={user} size={compact ? 'sm' : 'default'} className='mt-1' />
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
        <Button
          type='submit'
          size='sm'
          disabled={!isValid}
          isLoading={pending || Boolean(commentSubmission?.pending)}
          loadingText='Posting...'
          className='celestia-primary-action rounded'
        >
          {parentID ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  );
};

export default CommentComposer;
