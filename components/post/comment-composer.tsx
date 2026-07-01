'use client';

import type { FC } from 'react';
import type { CommentComposerProps } from '@/lib/types';
import { useRouter } from 'next/navigation';
import classNames from 'classnames';
import { useEffect, useRef, useState, useTransition } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const createCommentMutation = useCreateComment();
  const commentSubmission = useCommentSubmission();
  const { register, handleSubmit, onFormKeyDown, reset, watch, formState: { errors, isSubmitted, isValid, touchedFields } } = useFormValidate({
    schema: commentSchema,
    defaultValues: { body: '' },
  });
  const bodyField = register('body');
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const submitting = pending || createCommentMutation.isPending || Boolean(commentSubmission?.pending);
  const bodyValue = watch('body') ?? '';
  const isMainComposer = !compact && !parentID;
  const isOpen = !isMainComposer || isFocused || bodyValue.trim().length > 0;
  const placeholderText = placeholder ?? (isMainComposer ? 'Add a comment...' : 'Write a reply...');

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

  const onCancel = () => {
    reset();
    setIsFocused(false);
    bodyRef.current?.blur();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={onFormKeyDown}
      className={classNames(styles.form, {
        [styles.mainForm]: isMainComposer,
        [styles.open]: isOpen,
      })}
      noValidate
    >
      {!isMainComposer ? <UserAvatar user={user} size={compact ? 'sm' : 'default'} className={styles.avatar} /> : null}
      <div className={styles.fields}>
        <div className={styles.textareaShell}>
          <Textarea
            placeholder={placeholderText}
            rows={compact ? 2 : 3}
            maxLength={MAX_COMMENT_LENGTH}
            className={styles.textarea}
            aria-invalid={Boolean(errors.body && (touchedFields.body || isSubmitted))}
            {...bodyField}
            onBlur={event => {
              bodyField.onBlur(event);
              setIsFocused(false);
            }}
            onFocus={() => setIsFocused(true)}
            ref={element => {
              bodyField.ref(element);
              bodyRef.current = element;
            }}
          />
          {isMainComposer && isOpen ? (
            <div className={styles.actions}>
              <button type='button' className={styles.cancel} onClick={onCancel}>
                Cancel
              </button>
              <Button
                type='submit'
                size='sm'
                disabled={!isValid || submitting}
                aria-busy={submitting}
                className={classNames('celestia-primary-action', styles.submit)}
              >
                Comment
              </Button>
            </div>
          ) : null}
        </div>
        {errors.body && (touchedFields.body || isSubmitted) ? <p className={styles.error}>{errors.body.message}</p> : null}
        {!isMainComposer ? (
          <Button
            type='submit'
            size='sm'
            disabled={!isValid || submitting}
            aria-busy={submitting}
            className={classNames('celestia-primary-action', styles.submit)}
          >
            {parentID ? 'Reply' : 'Comment'}
          </Button>
        ) : null}
      </div>
    </form>
  );
};

export default CommentComposer;
