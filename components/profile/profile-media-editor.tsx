'use client';

import { updateProfileMediaAction } from '@/lib/actions/profile';
import { cn } from '@/lib/utils';
import { Camera, Check, LoaderCircle, Pencil } from 'lucide-react';
import { createContext, useActionState, useContext, useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  field: 'avatar' | 'cover';
  className?: string;
};

const ProfileEditContext = createContext({
  isEditing: false,
  toggleEditing: () => {},
});

export function ProfileMediaEditMode({ children }: { children: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <ProfileEditContext value={{ isEditing, toggleEditing: () => setIsEditing(editing => !editing) }}>
      {children}
    </ProfileEditContext>
  );
}

export function ProfileMediaEditButton() {
  const { isEditing, toggleEditing } = useContext(ProfileEditContext);

  return (
    <Button type='button' size='sm' onClick={toggleEditing} className='celestia-primary-action rounded-lg px-3'>
      {isEditing ? <Check className='size-3.5' /> : <Pencil className='size-3.5' />}
      {isEditing ? 'Done' : 'Edit profile'}
    </Button>
  );
}

export function ProfileMediaEditor({ field, className }: Props) {
  const [state, action, pending] = useActionState(updateProfileMediaAction, null);
  const { isEditing } = useContext(ProfileEditContext);
  const inputId = `profile-${field}-upload`;
  const label = field === 'avatar' ? 'Change profile image' : 'Change banner image';

  return (
    <form action={action} className={cn('absolute z-10', className)}>
      <input
        id={inputId}
        name={field}
        type='file'
        accept='image/png,image/jpeg,image/webp,image/gif'
        className='sr-only'
        disabled={pending}
        onChange={event => {
          if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit();
        }}
      />
      <label
        htmlFor={inputId}
        aria-label={label}
        title={label}
        aria-busy={pending}
        className={cn(
          'grid place-items-center transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 aria-busy:cursor-wait',
          field === 'avatar'
            ? 'size-full rounded-full bg-foreground/55 text-primary-foreground backdrop-blur-[1px]'
            : 'size-8 rounded-full border border-border/70 bg-card/95 text-foreground shadow-sm hover:bg-card',
          isEditing ? 'cursor-pointer opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {pending ? <LoaderCircle className='size-3.5 animate-spin' /> : <Camera className='size-3.5' />}
      </label>
      {state?.error ? <p className='absolute right-0 top-full mt-2 w-max rounded-md bg-destructive px-2 py-1 text-[11px] text-destructive-foreground shadow-md' role='alert'>{state.error}</p> : null}
    </form>
  );
}
