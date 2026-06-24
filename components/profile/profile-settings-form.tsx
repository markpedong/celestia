'use client';

import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { toast } from 'sonner';
import { updateProfileMediaAction, updateProfileSettingsAction } from '@/lib/actions/profile';
import { Input } from '@/components/ui/input';
import FormField from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import DialogActions from '@/components/ui/dialog-actions';
import SettingsDialog from '@/components/ui/settings-dialog';
import { SettingsOptionRow } from '@/components/ui/settings-option-row';
import { IMAGE_ACCEPT } from '@/constants';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';
import { useGetProfile } from '@/hooks/useQueries';
import z from 'zod';

const ProfileSettingsForm = () => {
  const queryClient = useQueryClient();
  const profile = useGetProfile().data?.data;

  const { profileDetailsSchema, profileMediaSchema } = useFormSchema();

  const [savingDetails, startSavingDetails] = useTransition();
  const [savingMedia, startSavingMedia] = useTransition();
  const [activeEditor, setActiveEditor] = useState<'displayName' | 'bio' | 'avatar' | 'banner' | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ kind: 'avatar' | 'banner'; url: string } | null>(null);
  const detailsForm = useFormValidate({
    schema: profileDetailsSchema,
    defaultValues: { displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' },
  });
  const mediaForm = useFormValidate({
    schema: profileMediaSchema,
    defaultValues: { avatar: undefined, cover: undefined },
  });

  const clearMediaPreview = () =>
    setMediaPreview(current => {
      if (current?.url.startsWith('blob:')) URL.revokeObjectURL(current.url);
      return null;
    });

  const openEditor = (editor: 'displayName' | 'bio' | 'avatar' | 'banner') => {
    if (editor === 'displayName' || editor === 'bio') {
      detailsForm.reset({ displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' });
    } else {
      mediaForm.reset({ avatar: undefined, cover: undefined });
    }

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

  const submitDetails = async (values: z.infer<typeof profileDetailsSchema>) => {
    startSavingDetails(async () => {
      const { displayName, bio } = values;
      const result = await updateProfileSettingsAction({ displayName, bio });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      closeEditor();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(result?.success ?? 'Profile details updated.');
    });
  };

  const submitMedia = async (values: z.infer<typeof profileMediaSchema>) => {
    startSavingMedia(async () => {
      const { avatar, cover } = values;
      const result = await updateProfileMediaAction({ avatar, cover });
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
            value={profile?.displayName || 'Not set'}
            onClick={() => openEditor('displayName')}
          />
          <SettingsOptionRow
            title='About / Bio'
            value={profile?.bio || 'Tell people a little about yourself.'}
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
            value={profile?.avatarUrl ? 'Image uploaded' : 'Not set'}
            onClick={() => openEditor('avatar')}
          />
          <SettingsOptionRow
            title='Banner'
            value={profile?.coverUrl ? 'Image uploaded' : 'Not set'}
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
        <form
          onSubmit={detailsForm.handleSubmit(submitDetails)}
          onKeyDown={detailsForm.onFormKeyDown}
          className='space-y-4'
          noValidate
        >
          <FormField
            label='Display Name'
            labelClassName='text-card-foreground'
            placeholder='johndoe'
            error={detailsForm.formState.errors.displayName?.message}
            maxLength={20}
            {...detailsForm.register('displayName')}
          />
          <DialogActions submitLabel='Save display name' submitLoading={savingDetails} />
        </form>
      </SettingsDialog>
      <SettingsDialog
        open={activeEditor === 'bio'}
        onOpenChange={open => !open && closeEditor()}
        title='About / Bio'
        description='Tell people a little about yourself.'
      >
        <form
          onSubmit={detailsForm.handleSubmit(submitDetails)}
          onKeyDown={detailsForm.onFormKeyDown}
          className='space-y-4'
          noValidate
        >
          <FormField htmlFor='bio' label='About / Bio' error={detailsForm.errors('bio')}>
            <Textarea
              id='bio'
              maxLength={500}
              rows={5}
              className='resize-y'
              aria-invalid={Boolean(detailsForm.errors('bio'))}
              {...detailsForm.register('bio')}
            />
          </FormField>
          <DialogActions submitLabel='Save bio' submitLoading={savingDetails} />
        </form>
      </SettingsDialog>
      {(['avatar', 'banner'] as const).map(kind => {
        const previewUrl =
          mediaPreview?.kind === kind ? mediaPreview.url : kind === 'avatar' ? profile?.avatarUrl : profile?.coverUrl;
        return (
          <SettingsDialog
            key={kind}
            open={activeEditor === kind}
            onOpenChange={open => !open && closeEditor()}
            title={kind === 'avatar' ? 'Avatar' : 'Banner'}
            description='Upload an image to update your public profile.'
          >
            <form
              onSubmit={mediaForm.handleSubmit(submitMedia)}
              onKeyDown={mediaForm.onFormKeyDown}
              className='space-y-4'
              noValidate
            >
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
                  aria-invalid={Boolean(mediaForm.formState.errors[kind === 'avatar' ? 'avatar' : 'cover'])}
                  {...mediaForm.register(kind === 'avatar' ? 'avatar' : 'cover', {
                    required: 'Choose an image to upload.',
                    onChange: event => previewMedia(kind, event.target.files?.[0]),
                  })}
                />
              </FormField>
              <DialogActions submitLabel={`Upload ${kind}`} submitLoading={savingMedia} />
            </form>
          </SettingsDialog>
        );
      })}
    </div>
  );
};

export default ProfileSettingsForm;
