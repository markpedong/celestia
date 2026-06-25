'use client';

import { useRef, useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { toast } from 'sonner';
import { updateProfileMediaAction, updateProfileSettingsAction } from '@/lib/actions/profile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { X } from 'lucide-react';

type MediaKind = 'avatar' | 'banner';
type MediaPreview = {
  kind: MediaKind;
  file: File;
  url: string;
  x: number;
  y: number;
  zoom: number;
};

const adjustedImageFile = async (preview: MediaPreview): Promise<File> => {
  const image = new window.Image();
  image.src = preview.url;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to load image preview.'));
  });

  const outputWidth = preview.kind === 'avatar' ? 800 : 1600;
  const outputHeight = preview.kind === 'avatar' ? 800 : 533;
  const aspect = outputWidth / outputHeight;
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const baseCropWidth = sourceWidth / sourceHeight > aspect ? sourceHeight * aspect : sourceWidth;
  const baseCropHeight = sourceWidth / sourceHeight > aspect ? sourceHeight : sourceWidth / aspect;
  const cropWidth = baseCropWidth / preview.zoom;
  const cropHeight = baseCropHeight / preview.zoom;
  const cropX = (sourceWidth - cropWidth) * (preview.x / 100);
  const cropY = (sourceHeight - cropHeight) * (preview.y / 100);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to adjust this image.');
  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => (result ? resolve(result) : reject(new Error('Unable to adjust this image.'))), preview.file.type);
  });
  return new File([blob], preview.file.name, { type: preview.file.type });
};

const ProfileSettingsForm = () => {
  const queryClient = useQueryClient();
  const profile = useGetProfile().data?.data;

  const { profileDetailsSchema, profileMediaSchema } = useFormSchema();

  const [savingDetails, startSavingDetails] = useTransition();
  const [savingMedia, startSavingMedia] = useTransition();
  const [activeEditor, setActiveEditor] = useState<'displayName' | 'bio' | MediaKind | null>(null);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const mediaInputRefs = useRef<Record<MediaKind, HTMLInputElement | null>>({
    avatar: null,
    banner: null,
  });
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
  const clearSelectedMedia = (kind: MediaKind) => {
    const field = kind === 'avatar' ? 'avatar' : 'cover';
    if (mediaInputRefs.current[kind]) mediaInputRefs.current[kind]!.value = '';
    mediaForm.resetField(field);
    clearMediaPreview();
  };

  const openEditor = (editor: 'displayName' | 'bio' | MediaKind) => {
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

  const previewMedia = (kind: MediaKind, file?: File) => {
    if (!file) return;
    setMediaPreview(current => {
      if (current?.url.startsWith('blob:')) URL.revokeObjectURL(current.url);
      return { kind, file, url: URL.createObjectURL(file), x: 50, y: 50, zoom: 1 };
    });
  };
  const updateMediaPreview = (values: Partial<Pick<MediaPreview, 'x' | 'y' | 'zoom'>>) => {
    setMediaPreview(current => (current ? { ...current, ...values } : current));
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
      let adjustedFile: File | null = null;
      try {
        adjustedFile = mediaPreview ? await adjustedImageFile(mediaPreview) : null;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to adjust this image.');
        return;
      }
      const result = await updateProfileMediaAction({
        avatar: mediaPreview?.kind === 'avatar' && adjustedFile ? adjustedFile : values.avatar,
        cover: mediaPreview?.kind === 'banner' && adjustedFile ? adjustedFile : values.cover,
      });
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
        const field = kind === 'avatar' ? 'avatar' : 'cover';
        const registration = mediaForm.register(field, {
          required: 'Choose an image to upload.',
          onChange: event => previewMedia(kind, event.target.files?.[0]),
        });
        const previewUrl =
          mediaPreview?.kind === kind ? mediaPreview.url : kind === 'avatar' ? profile?.avatarUrl : profile?.coverUrl;
        return (
          <SettingsDialog
            key={kind}
            open={activeEditor === kind}
            onOpenChange={open => !open && closeEditor()}
            title={kind === 'avatar' ? 'Avatar' : 'Banner'}
            description='Upload an image to update your public profile.'
            contentClassName={kind === 'banner' ? 'sm:max-w-2xl' : 'sm:max-w-md'}
          >
            <form
              onSubmit={mediaForm.handleSubmit(submitMedia)}
              onKeyDown={mediaForm.onFormKeyDown}
              className='space-y-4'
              noValidate
            >
              <div
                className={`relative overflow-hidden rounded-lg border border-border bg-muted ${kind === 'avatar' ? 'mx-auto size-40' : 'aspect-3/1 w-full'}`}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={`${kind === 'avatar' ? 'Avatar' : 'Banner'} preview`}
                    fill
                    unoptimized
                    className='object-cover'
                    style={{
                      objectPosition: mediaPreview?.kind === kind ? `${mediaPreview.x}% ${mediaPreview.y}%` : '50% 50%',
                      transform: mediaPreview?.kind === kind ? `scale(${mediaPreview.zoom})` : undefined,
                    }}
                  />
                ) : (
                  <span className='grid size-full place-items-center text-xs text-muted-foreground'>
                    No image selected
                  </span>
                )}
              </div>
              {mediaPreview?.kind === kind ? (
                <div className='grid gap-3 rounded border border-border bg-muted/30 p-3'>
                  <label className='grid gap-1 text-xs font-medium text-muted-foreground'>
                    Horizontal position
                    <input
                      type='range'
                      min='0'
                      max='100'
                      value={mediaPreview.x}
                      onChange={event => updateMediaPreview({ x: Number(event.target.value) })}
                    />
                  </label>
                  <label className='grid gap-1 text-xs font-medium text-muted-foreground'>
                    Vertical position
                    <input
                      type='range'
                      min='0'
                      max='100'
                      value={mediaPreview.y}
                      onChange={event => updateMediaPreview({ y: Number(event.target.value) })}
                    />
                  </label>
                  <label className='grid gap-1 text-xs font-medium text-muted-foreground'>
                    Zoom
                    <input
                      type='range'
                      min='1'
                      max='2'
                      step='0.05'
                      value={mediaPreview.zoom}
                      onChange={event => updateMediaPreview({ zoom: Number(event.target.value) })}
                    />
                  </label>
                </div>
              ) : null}
              <FormField
                htmlFor={`${kind}-upload`}
                label={kind === 'avatar' ? 'Profile image' : 'Banner image'}
                error={mediaForm.formState.errors[field]?.message}
              >
                <div className='flex gap-2'>
                  <Input
                    id={`${kind}-upload`}
                    type='file'
                    accept={IMAGE_ACCEPT}
                    required
                    disabled={savingMedia}
                    aria-invalid={Boolean(mediaForm.formState.errors[field])}
                    name={registration.name}
                    onBlur={registration.onBlur}
                    onChange={registration.onChange}
                    onClick={() => clearSelectedMedia(kind)}
                    ref={node => {
                      registration.ref(node);
                      mediaInputRefs.current[kind] = node;
                    }}
                  />
                  {mediaPreview?.kind === kind ? (
                    <Button
                      type='button'
                      variant='outline'
                      size='icon-lg'
                      disabled={savingMedia}
                      onClick={() => clearSelectedMedia(kind)}
                      aria-label={`Remove selected ${kind === 'avatar' ? 'profile image' : 'banner image'}`}
                    >
                      <X />
                    </Button>
                  ) : null}
                </div>
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
