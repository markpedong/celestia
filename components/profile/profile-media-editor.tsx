'use client';

import { updateProfileMediaAction } from '@/lib/actions/profile';
import { Image as ImageIcon, Images } from 'lucide-react';
import { useActionState, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = {
  className?: string;
};

export function ProfileMediaEditor({ className }: Props) {
  const [state, action, pending] = useActionState(updateProfileMediaAction, null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [avatarName, setAvatarName] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);

  return (
    <form action={action} encType='multipart/form-data' className={cn('border-t border-border/70 pt-4', className)}>
      <div className='flex flex-wrap items-center gap-2'>
        <input
          ref={avatarInput}
          name='avatar'
          type='file'
          accept='image/png,image/jpeg,image/webp,image/gif'
          className='sr-only'
          onChange={event => setAvatarName(event.target.files?.[0]?.name ?? null)}
        />
        <input
          ref={coverInput}
          name='cover'
          type='file'
          accept='image/png,image/jpeg,image/webp,image/gif'
          className='sr-only'
          onChange={event => setCoverName(event.target.files?.[0]?.name ?? null)}
        />
        <button type='button' onClick={() => avatarInput.current?.click()} className='inline-flex max-w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground celestia-hover-surface'>
          <ImageIcon className='size-3.5 text-primary' />
          <span className='max-w-36 truncate'>{avatarName ?? 'Profile image'}</span>
        </button>
        <button type='button' onClick={() => coverInput.current?.click()} className='inline-flex max-w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground celestia-hover-surface'>
          <Images className='size-3.5 text-accent' />
          <span className='max-w-36 truncate'>{coverName ?? 'Cover photo'}</span>
        </button>
        <Button type='submit' size='sm' disabled={pending} className='ml-auto h-8 rounded-lg text-xs'>
          {pending ? 'Uploading...' : 'Save media'}
        </Button>
      </div>
      {state?.error ? <p className='mt-2 text-xs text-destructive' role='alert'>{state.error}</p> : null}
      {state?.success ? <p className='mt-2 text-xs text-primary' role='status'>{state.success}</p> : null}
    </form>
  );
}
