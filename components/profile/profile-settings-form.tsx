'use client';

import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { toast } from 'sonner';
import { updateProfileMediaAction, updateProfileSettingsAction } from '@/lib/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormField from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import SettingsDialog from '@/components/ui/settings-dialog';
import { SettingsOptionRow } from '@/components/ui/settings-option-row';
import { IMAGE_ACCEPT } from '@/constants';
import { profileDetailsSchema, profileMediaSchema } from '@/lib/form-schemas';
import { useZodForm } from '@/hooks/use-zod-form';

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
  const detailsForm = useZodForm(profileDetailsSchema, { displayName: profile.displayName ?? '', bio: profile.bio ?? '' });
  const mediaForm = useZodForm(profileMediaSchema, { avatar: undefined, cover: undefined });

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

  const submitDetails = detailsForm.handleSubmit(({ displayName, bio }) => {
    const formData = new FormData();
    formData.set('displayName', displayName);
    formData.set('bio', bio);
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
  });

  const submitMedia = mediaForm.handleSubmit(({ avatar, cover }) => {
    const formData = new FormData();
    if (avatar?.[0]) formData.set('avatar', avatar[0]);
    if (cover?.[0]) formData.set('cover', cover[0]);
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
  });

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
        <form onSubmit={submitDetails} onKeyDown={detailsForm.onFormKeyDown} className='space-y-4' noValidate>
          <FormField htmlFor='displayName' label='Display Name'>
            <Input id='displayName' maxLength={80} {...detailsForm.register('displayName')} />
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
        <form onSubmit={submitDetails} onKeyDown={detailsForm.onFormKeyDown} className='space-y-4' noValidate>
          <FormField htmlFor='bio' label='About / Bio'>
            <Textarea id='bio' maxLength={500} rows={5} className='resize-y' {...detailsForm.register('bio')} />
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
            <form onSubmit={submitMedia} onKeyDown={mediaForm.onFormKeyDown} className='space-y-4' noValidate>
              <div
                className={`relative overflow-hidden rounded-lg border border-border bg-muted ${kind === 'avatar' ? 'size-28' : 'aspect-3/1 w-full'}`}
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
              <FormField
                htmlFor={`${kind}-upload`}
                label={kind === 'avatar' ? 'Profile image' : 'Banner image'}
                error={mediaForm.formState.errors[kind === 'avatar' ? 'avatar' : 'cover']?.message}
              >
                <Input
                  id={`${kind}-upload`}
                  type='file'
                  accept={IMAGE_ACCEPT}
                  required
                  disabled={savingMedia}
                  {...mediaForm.register(kind === 'avatar' ? 'avatar' : 'cover', {
                    required: 'Choose an image to upload.',
                    onChange: event => previewMedia(kind, event.target.files?.[0]),
                  })}
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
