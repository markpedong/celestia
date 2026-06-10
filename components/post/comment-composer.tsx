'use client';

import { createCommentAction } from '@/lib/actions/comments';
import { User } from '@/lib/types';
import { UserAvatar } from '@neondatabase/auth/react';
import { useRouter } from 'next/navigation';
import { FC, useRef, useState, useTransition } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

type Props = {
  postID: string;
  user: User;
  parentId?: string | null;
  placeholder?: string;
  compact?: boolean;
};

const CommentComposer: FC<Props> = ({ postID, user, compact, parentId, placeholder }) => {
  const formRef = useRef(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    startTransition(async () => {
      const res = await createCommentAction(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className='flex gap-3'>
      <input type='hidden' name='postId' value={postID} />
      <input type='hidden' name='parentId' value={parentId ?? ''} />
      <UserAvatar user={user} size={compact ? 'sm' : 'default'} className='mt-1 shrink-0' />
      <div className='min-w-0 flex-1 space-y-2'>
        <Textarea
          name='body'
          required
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className='min-h-0 resize-y border-border bg-card text-sm'
        />
        {error ? (
          <p className='text-xs text-destructive' role='alert'>
            {error}
          </p>
        ) : null}
        <Button type='submit' size='sm' disabled={pending}>
          {pending ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  );
};

export default CommentComposer;
