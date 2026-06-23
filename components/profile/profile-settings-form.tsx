'use client';

import { useActionState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Camera, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfileMediaAction, updateProfileSettingsAction } from '@/lib/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { IMAGE_ACCEPT } from '@/constants';

type ProfileSettingsFormProps = {
  profile: {
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
  };
};

export const ProfileSettingsForm = ({ profile }: ProfileSettingsFormProps) => {
  const queryClient = useQueryClient();
  const [detailsState, saveDetails, savingDetails] = useActionState(updateProfileSettingsAction, null);
  const [mediaState, saveMedia, savingMedia] = useActionState(updateProfileMediaAction, null);

  useEffect(() => {
    const message = detailsState?.error ?? detailsState?.success ?? mediaState?.error ?? mediaState?.success;
    if (message) (detailsState?.error || mediaState?.error ? toast.error : toast.success)(message);
    if (detailsState?.success || mediaState?.success) void queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [detailsState, mediaState, queryClient]);

  return (
    <div className='space-y-5'>
      <section className='celestia-card overflow-hidden'>
        <div className='relative h-36 bg-[linear-gradient(135deg,var(--primary),var(--accent))]'>
          {profile.coverUrl ? <Image src={profile.coverUrl} alt='' fill unoptimized className='object-cover' /> : null}
          <form action={saveMedia} className='absolute right-3 bottom-3'>
            <input
              id='cover-upload'
              name='cover'
              type='file'
              accept={IMAGE_ACCEPT}
              className='sr-only'
              disabled={savingMedia}
              onChange={event => event.currentTarget.files?.length && event.currentTarget.form?.requestSubmit()}
            />
            <label htmlFor='cover-upload' className='inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-card/95 px-3 text-xs font-medium shadow-sm hover:bg-card'>
              <Camera className='size-3.5' /> {savingMedia ? 'Uploading…' : 'Change banner'}
            </label>
          </form>
        </div>
        <div className='flex items-end gap-4 px-5 pb-5'>
          <div className='relative -mt-10 size-20 overflow-hidden rounded-full border-4 border-card bg-muted'>
            {profile.avatarUrl ? <Image src={profile.avatarUrl} alt='' fill unoptimized className='object-cover' /> : null}
            <form action={saveMedia} className='absolute inset-0 grid place-items-center bg-foreground/45 opacity-0 transition-opacity hover:opacity-100'>
              <input
                id='avatar-upload'
                name='avatar'
                type='file'
                accept={IMAGE_ACCEPT}
                className='sr-only'
                disabled={savingMedia}
                onChange={event => event.currentTarget.files?.length && event.currentTarget.form?.requestSubmit()}
              />
              <label htmlFor='avatar-upload' className='grid size-full cursor-pointer place-items-center text-primary-foreground' aria-label='Change profile image'>
                <Camera className='size-5' />
              </label>
            </form>
          </div>
          <p className='pb-1 text-sm text-muted-foreground'>Update the photo and banner people see on your profile.</p>
        </div>
      </section>

      <form action={saveDetails} className='celestia-card space-y-5 p-5 md:p-6'>
        <div>
          <h2 className='text-base font-semibold'>Profile details</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Control how you appear across Celestia.</p>
        </div>
        <FormField htmlFor='username' label='Username' hint='Lowercase letters, numbers, and underscores only.'>
          <Input id='username' name='username' defaultValue={profile.username} maxLength={28} required className='bg-secondary/80' />
        </FormField>
        <FormField htmlFor='displayName' label='Display Name'>
          <Input id='displayName' name='displayName' defaultValue={profile.displayName ?? ''} maxLength={80} className='bg-secondary/80' />
        </FormField>
        <FormField htmlFor='bio' label='About / Bio' hint='Tell people a little about yourself.'>
          <Textarea id='bio' name='bio' defaultValue={profile.bio ?? ''} maxLength={500} rows={5} className='resize-y bg-secondary/80' />
        </FormField>
        <Button type='submit' isLoading={savingDetails} loadingText='Saving…' className='celestia-primary-action'>
          <Save className='size-4' /> Save profile
        </Button>
      </form>
    </div>
  );
};
