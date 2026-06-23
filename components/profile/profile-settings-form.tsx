'use client';

import { useActionState, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProfileMediaAction, updateProfileSettingsAction } from '@/lib/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { DialogClose, DialogFooter, SettingsDialog } from '@/components/ui/dialog';
import { SettingsOptionRow } from '@/components/ui/settings-option-row';
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
  const [activeEditor, setActiveEditor] = useState<'username' | 'displayName' | 'bio' | 'avatar' | 'banner' | null>(null);

  useEffect(() => {
    const message = detailsState?.error ?? detailsState?.success ?? mediaState?.error ?? mediaState?.success;
    if (message) (detailsState?.error || mediaState?.error ? toast.error : toast.success)(message);
    if (detailsState?.success || mediaState?.success) {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  }, [detailsState, mediaState, queryClient]);

  return (
    <div className='space-y-5'>
      <section className='celestia-card space-y-5 p-5 md:p-6'>
        <div>
          <h2 className='text-base font-semibold'>Profile details</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Control how you appear across Celestia.</p>
        </div>
        <div className='divide-y divide-border rounded-lg border border-border'>
          <SettingsOptionRow title='Username' value={`u/${profile.username}`} onClick={() => setActiveEditor('username')} />
          <SettingsOptionRow title='Display Name' value={profile.displayName || 'Not set'} onClick={() => setActiveEditor('displayName')} />
          <SettingsOptionRow title='About / Bio' value={profile.bio || 'Tell people a little about yourself.'} onClick={() => setActiveEditor('bio')} />
        </div>
      </section>
      <section className='celestia-card space-y-5 p-5 md:p-6'>
        <div><h2 className='text-base font-semibold'>Profile media</h2><p className='mt-1 text-sm text-muted-foreground'>Choose the images people see on your profile.</p></div>
        <div className='divide-y divide-border rounded-lg border border-border'>
          <SettingsOptionRow title='Avatar' value={profile.avatarUrl ? 'Image uploaded' : 'Not set'} onClick={() => setActiveEditor('avatar')} />
          <SettingsOptionRow title='Banner' value={profile.coverUrl ? 'Image uploaded' : 'Not set'} onClick={() => setActiveEditor('banner')} />
        </div>
      </section>

      <SettingsDialog open={activeEditor === 'username'} onOpenChange={open => !open && setActiveEditor(null)} title='Username' description='Lowercase letters, numbers, and underscores only.'><form action={saveDetails} className='space-y-4'><input type='hidden' name='displayName' value={profile.displayName ?? ''} /><input type='hidden' name='bio' value={profile.bio ?? ''} /><FormField htmlFor='username' label='Username'><Input id='username' name='username' defaultValue={profile.username} maxLength={28} required /></FormField><DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={savingDetails}>Save username</Button></DialogFooter></form></SettingsDialog>
      <SettingsDialog open={activeEditor === 'displayName'} onOpenChange={open => !open && setActiveEditor(null)} title='Display Name' description='This is the name shown across Celestia.'><form action={saveDetails} className='space-y-4'><input type='hidden' name='username' value={profile.username} /><input type='hidden' name='bio' value={profile.bio ?? ''} /><FormField htmlFor='displayName' label='Display Name'><Input id='displayName' name='displayName' defaultValue={profile.displayName ?? ''} maxLength={80} /></FormField><DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={savingDetails}>Save display name</Button></DialogFooter></form></SettingsDialog>
      <SettingsDialog open={activeEditor === 'bio'} onOpenChange={open => !open && setActiveEditor(null)} title='About / Bio' description='Tell people a little about yourself.'><form action={saveDetails} className='space-y-4'><input type='hidden' name='username' value={profile.username} /><input type='hidden' name='displayName' value={profile.displayName ?? ''} /><FormField htmlFor='bio' label='About / Bio'><Textarea id='bio' name='bio' defaultValue={profile.bio ?? ''} maxLength={500} rows={5} className='resize-y' /></FormField><DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={savingDetails}>Save bio</Button></DialogFooter></form></SettingsDialog>
      {(['avatar', 'banner'] as const).map(kind => <SettingsDialog key={kind} open={activeEditor === kind} onOpenChange={open => !open && setActiveEditor(null)} title={kind === 'avatar' ? 'Avatar' : 'Banner'} description='Upload an image to update your public profile.'><form action={saveMedia} className='space-y-4'><FormField htmlFor={`${kind}-upload`} label={kind === 'avatar' ? 'Profile image' : 'Banner image'}><Input id={`${kind}-upload`} name={kind === 'avatar' ? 'avatar' : 'cover'} type='file' accept={IMAGE_ACCEPT} required disabled={savingMedia} /></FormField><DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={savingMedia}>Upload {kind}</Button></DialogFooter></form></SettingsDialog>)}
    </div>
  );
};
