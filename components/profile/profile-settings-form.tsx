'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { toast } from 'sonner';
import { updateProfileMediaAction, updateProfileSettingsAction } from '@/lib/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { SettingsDialog } from '@/components/ui/settings-dialog';
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
  const [savingDetails, startSavingDetails] = useTransition();
  const [savingMedia, startSavingMedia] = useTransition();
  const [activeEditor, setActiveEditor] = useState<'displayName' | 'bio' | 'avatar' | 'banner' | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ kind: 'avatar' | 'banner'; url: string } | null>(null);

  const clearMediaPreview = () =>
    setMediaPreview(current => {
      if (current?.url.startsWith('blob:')) URL.revokeObjectURL(current.url);
      return null;
    });

  const openEditor = (editor: 'displayName' | 'bio' | 'avatar' | 'banner') => {
    if (editor === 'avatar' || editor === 'banner') clearMediaPreview();
    setActiveEditor(editor);
  };

  const closeEditor = () => {
    setActiveEditor(null);
    clearMediaPreview();
  };

  const previewMedia = (kind: 'avatar' | 'banner', file?: File) => {
    if (!file) return;
    setMediaPreview(current => {
      if (current?.url.startsWith('blob:')) URL.revokeObjectURL(current.url);
      return { kind, url: URL.createObjectURL(file) };
    });
  };

  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startSavingDetails(async () => {
      const result = await updateProfileSettingsAction(null, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      closeEditor();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(result?.success ?? 'Profile details updated.');
    });
  };

  const submitMedia = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startSavingMedia(async () => {
      const result = await updateProfileMediaAction(null, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      closeEditor();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(result?.success ?? 'Profile media updated.');
    });
  };

  return (
    <div className='space-y-5'>
      <section className='celestia-card space-y-5 p-5 md:p-6'>
        <div>
          <h2 className='text-base font-semibold'>Profile details</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Control how you appear across Celestia.</p>
        </div>
        <div className='divide-y divide-border rounded-lg border border-border'>
          <SettingsOptionRow
            title='Display Name'
            value={profile.displayName || 'Not set'}
            onClick={() => openEditor('displayName')}
          />
          <SettingsOptionRow
            title='About / Bio'
            value={profile.bio || 'Tell people a little about yourself.'}
            onClick={() => openEditor('bio')}
          />
        </div>
      </section>
      <section className='celestia-card space-y-5 p-5 md:p-6'>
        <div>
          <h2 className='text-base font-semibold'>Profile media</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Choose the images people see on your profile.</p>
        </div>
        <div className='divide-y divide-border rounded-lg border border-border'>
          <SettingsOptionRow
            title='Avatar'
            value={profile.avatarUrl ? 'Image uploaded' : 'Not set'}
            onClick={() => openEditor('avatar')}
          />
          <SettingsOptionRow
            title='Banner'
            value={profile.coverUrl ? 'Image uploaded' : 'Not set'}
            onClick={() => openEditor('banner')}
          />
        </div>
      </section>

      <SettingsDialog
        open={activeEditor === 'displayName'}
        onOpenChange={open => !open && closeEditor()}
        title='Display Name'
        description='This is the name shown across Celestia.'
      >
        <form onSubmit={submitDetails} className='space-y-4'>
          <input type='hidden' name='bio' value={profile.bio ?? ''} />
          <FormField htmlFor='displayName' label='Display Name'>
            <Input id='displayName' name='displayName' defaultValue={profile.displayName ?? ''} maxLength={80} />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type='button' variant='outline'>
                Cancel
              </Button>
            </DialogClose>
            <Button type='submit' isLoading={savingDetails}>
              Save display name
            </Button>
          </DialogFooter>
        </form>
      </SettingsDialog>
      <SettingsDialog
        open={activeEditor === 'bio'}
        onOpenChange={open => !open && closeEditor()}
        title='About / Bio'
        description='Tell people a little about yourself.'
      >
        <form onSubmit={submitDetails} className='space-y-4'>
          <input type='hidden' name='displayName' value={profile.displayName ?? ''} />
          <FormField htmlFor='bio' label='About / Bio'>
            <Textarea
              id='bio'
              name='bio'
              defaultValue={profile.bio ?? ''}
              maxLength={500}
              rows={5}
              className='resize-y'
            />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type='button' variant='outline'>
                Cancel
              </Button>
            </DialogClose>
            <Button type='submit' isLoading={savingDetails}>
              Save bio
            </Button>
          </DialogFooter>
        </form>
      </SettingsDialog>
      {(['avatar', 'banner'] as const).map(kind => {
        const previewUrl =
          mediaPreview?.kind === kind ? mediaPreview.url : kind === 'avatar' ? profile.avatarUrl : profile.coverUrl;
        return (
          <SettingsDialog
            key={kind}
            open={activeEditor === kind}
            onOpenChange={open => !open && closeEditor()}
            title={kind === 'avatar' ? 'Avatar' : 'Banner'}
            description='Upload an image to update your public profile.'
          >
            <form onSubmit={submitMedia} className='space-y-4'>
              <div
                className={`relative overflow-hidden rounded-lg border border-border bg-muted ${kind === 'avatar' ? 'size-28' : 'aspect-[3/1] w-full'}`}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={`${kind === 'avatar' ? 'Avatar' : 'Banner'} preview`}
                    fill
                    unoptimized
                    className='object-cover'
                  />
                ) : (
                  <span className='grid size-full place-items-center text-xs text-muted-foreground'>
                    No image selected
                  </span>
                )}
              </div>
              <FormField htmlFor={`${kind}-upload`} label={kind === 'avatar' ? 'Profile image' : 'Banner image'}>
                <Input
                  id={`${kind}-upload`}
                  name={kind === 'avatar' ? 'avatar' : 'cover'}
                  type='file'
                  accept={IMAGE_ACCEPT}
                  required
                  disabled={savingMedia}
                  onChange={event => previewMedia(kind, event.currentTarget.files?.[0])}
                />
              </FormField>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type='button' variant='outline'>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type='submit' isLoading={savingMedia}>
                  Upload {kind}
                </Button>
              </DialogFooter>
            </form>
          </SettingsDialog>
        );
      })}
    </div>
  );
};
