'use client';

import type { FC } from 'react';
import type { CommentComposerProps } from '@/lib/types';
import { useRouter } from 'next/navigation';
import classNames from 'classnames';
import { useEffect, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/user-avatar';
import { useCommentSubmission } from './comment-submission-context';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';
import { MAX_COMMENT_LENGTH } from '@/constants';
import { useCreateComment } from '@/hooks/useQueries';
import styles from './comment-composer.module.scss';

const CommentComposer: FC<CommentComposerProps> = ({ postID, user, compact, parentID, placeholder }) => {
  const { commentSchema } = useFormSchema();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const createCommentMutation = useCreateComment();
  const commentSubmission = useCommentSubmission();
  const { register, handleSubmit, onFormKeyDown, reset, formState: { errors, isSubmitted, isValid, touchedFields } } = useFormValidate({
    schema: commentSchema,
    defaultValues: { body: '' },
  });
  const bodyField = register('body');
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const submitting = pending || createCommentMutation.isPending || Boolean(commentSubmission?.pending);

  useEffect(() => {
    if (parentID) bodyRef.current?.focus();
  }, [parentID]);

  const onSubmit = async ({ body }: { body: string }) => {
    const pendingComment = { postID: postID, parentID: parentID ?? null, body: body.trim(), author: user };

    if (commentSubmission) {
      const res = await commentSubmission.submitComment(pendingComment);
      if (res?.error) toast.error(res.error);
      else reset();
      return;
    }

    startTransition(async () => {
      const res = await createCommentMutation.mutateAsync(pendingComment);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      reset();
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onFormKeyDown} className={styles.form} noValidate>
      <UserAvatar user={user} size={compact ? 'sm' : 'default'} className={styles.avatar} />
      <div className={styles.fields}>
        <Textarea
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          maxLength={MAX_COMMENT_LENGTH}
          className={styles.textarea}
          aria-invalid={Boolean(errors.body && (touchedFields.body || isSubmitted))}
          {...bodyField}
          ref={element => {
            bodyField.ref(element);
            bodyRef.current = element;
          }}
        />
        {errors.body && (touchedFields.body || isSubmitted) ? <p className={styles.error}>{errors.body.message}</p> : null}
        <Button
          type='submit'
          size='sm'
          disabled={!isValid || submitting}
          aria-busy={submitting}
          className={classNames('celestia-primary-action', styles.submit)}
        >
          {parentID ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  );
};

export default CommentComposer;
