'use client';

import { IMAGE_ACCEPT } from '@/constants';
import useFormSchema from '@/hooks/useFormSchema';
import useFormValidate from '@/hooks/useFormValidate';
import { useUpdateCommunity, useUploadImages } from '@/hooks/useQueries';
import type { Community } from '@/lib/types';
import { updateCommunity } from '@/services';
import { ImagePlus, Save, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type FC } from 'react';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '../ui/button';
import FormField from '../ui/form-field';
import { Input } from '../ui/input';

type CommunityMediaValues = {
  avatar?: FileList;
  cover?: FileList;
};

export const CommunityDetailsSettingsForm: FC<{ community: Community }> = ({ community }) => {
  const { communitySettingsSchema } = useFormSchema();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitted, isValid, touchedFields },
    onFormKeyDown,
    setValue,
    watch,
  } = useFormValidate({
    schema: communitySettingsSchema,
    defaultValues: { label: community.label, description: community.description, hashColor: community.hashColor },
  });
  const { mutate, isPending } = useUpdateCommunity();
  const hashColor = watch('hashColor');
  const previewColor = /^#[0-9a-f]{6}$/i.test(hashColor) ? hashColor : community.hashColor;

  const onSubmit = (values: z.infer<typeof communitySettingsSchema>) => {
    mutate({ ...values, slug: community.slug });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onFormKeyDown} className='space-y-5' noValidate>
      <input type='hidden' name='slug' value={community.slug} />
      <div>
        <p className='celestia-panel-label'>Identity</p>
        <h2 className='mt-2 text-xl font-bold tracking-tight'>Community details</h2>
        <p className='mt-1 text-sm text-muted-foreground'>Tune the public name, description, and accent color.</p>
      </div>
      <div className='rounded border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground'>
        Community URL: <span className='font-semibold text-foreground'>r/{community.slug}</span>. URLs stay fixed after
        creation.
      </div>
      <FormField
        label='Community Name'
        placeholder='e.g. Indie Makers'
        error={errors.label && errors.label.message}
        {...register('label')}
      />
      <FormField
        label='Description'
        as='textarea'
        rows={6}
        className='resize-y bg-secondary/80 leading-6'
        placeholder="Introduce your community. Explain its purpose, the type of content members should post, and any guidelines you'd like everyone to follow."
        error={errors.description && errors.description.message}
        {...register('description')}
      />
      <FormField htmlFor='hashColor' label='Community color' error={errors.hashColor && errors.hashColor.message}>
        <div className='flex items-center gap-3'>
          <input
            type='color'
            value={previewColor}
            onChange={event =>
              setValue('hashColor', event.target.value, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
            className='size-11 shrink-0 cursor-pointer rounded border border-border bg-secondary/80 p-1'
            aria-label='Choose community color'
          />
          <Input
            id='hashColor'
            className='max-w-40 bg-secondary/80 font-mono'
            aria-invalid={Boolean(errors.hashColor && (touchedFields.hashColor || isSubmitted))}
            {...register('hashColor')}
          />
        </div>
      </FormField>
      <Button
        type='submit'
        disabled={!isValid || isPending}
        isLoading={isPending}
        loadingText='Saving...'
        className='celestia-primary-action h-11 w-full sm:w-auto'
      >
        <Save /> Save details
      </Button>
    </form>
  );
};

export const CommunityVisualSettingsForm: FC<{ community: Community }> = ({ community }) => {
  const router = useRouter();
  const uploadImages = useUploadImages();
  const [savingMedia, startSavingMedia] = useTransition();
  const [mediaPreview, setMediaPreview] = useState<Partial<Record<'avatar' | 'cover', string>>>({});
  const mediaPreviewRef = useRef(mediaPreview);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const previewColor = community.hashColor;
  const mediaForm = useFormValidate<CommunityMediaValues>({
    defaultValues: { avatar: undefined, cover: undefined },
  });
  const avatarPreview = mediaPreview.avatar ?? community.avatarUrl;
  const coverPreview = mediaPreview.cover ?? community.coverUrl;

  useEffect(() => {
    mediaPreviewRef.current = mediaPreview;
  }, [mediaPreview]);

  useEffect(
    () => () => {
      Object.values(mediaPreviewRef.current).forEach(url => {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    },
    [],
  );

  const previewMedia = (kind: 'avatar' | 'cover', file?: File) => {
    if (!file) return;
    setMediaPreview(current => {
      const previousUrl = current[kind];
      if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
      return { ...current, [kind]: URL.createObjectURL(file) };
    });
  };

  const clearMedia = (kind: 'avatar' | 'cover') => {
    const input = kind === 'avatar' ? avatarInputRef.current : coverInputRef.current;
    if (input) input.value = '';
    mediaForm.resetField(kind);
    setMediaPreview(current => {
      const previousUrl = current[kind];
      if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
      const next = { ...current };
      delete next[kind];
      return next;
    });
  };

  const avatarRegistration = mediaForm.register('avatar', {
    onChange: event => previewMedia('avatar', event.target.files?.[0]),
  });
  const coverRegistration = mediaForm.register('cover', {
    onChange: event => previewMedia('cover', event.target.files?.[0]),
  });

  const submitMedia = async (values: CommunityMediaValues) => {
    startSavingMedia(async () => {
      try {
        const avatarUrl = values.avatar?.[0]
          ? (await uploadImages.mutateAsync({ files: [values.avatar[0]], bucket: 'community-avatars' }))[0]
          : undefined;
        const coverUrl = values.cover?.[0]
          ? (await uploadImages.mutateAsync({ files: [values.cover[0]], bucket: 'community-covers' }))[0]
          : undefined;

        const result = await updateCommunity({ slug: community.slug, avatarUrl, coverUrl });
        if (!result.success) {
          toast.error(result.message || 'Unable to update community media.');
          return;
        }

        setMediaPreview(current => {
          Object.values(current).forEach(url => {
            if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
          });
          return {};
        });
        mediaForm.reset({ avatar: undefined, cover: undefined });
        router.refresh();
        toast.success(result.message || 'Community media updated.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to upload community media.');
        return;
      }
    });
  };

  return (
    <form onSubmit={mediaForm.handleSubmit(submitMedia)} onKeyDown={mediaForm.onFormKeyDown} className='space-y-5' noValidate>
      <div>
        <p className='celestia-panel-label'>Visuals</p>
        <h2 className='mt-2 text-xl font-bold tracking-tight'>Community media</h2>
        <p className='mt-1 text-sm text-muted-foreground'>Upload the profile image and cover photo for r/{community.slug}.</p>
      </div>
      <div className='overflow-hidden rounded border border-border bg-card shadow-2xl shadow-background/20'>
        <div className='relative aspect-3/1 overflow-hidden bg-secondary/80'>
          {coverPreview ? (
            <Image src={coverPreview} alt='Community cover preview' fill unoptimized className='object-cover' />
          ) : (
            <div className='size-full' style={{ background: `linear-gradient(135deg, ${previewColor}55, transparent)` }} />
          )}
          <div className='absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(5,8,20,0.62)_100%)]' />
        </div>
        <div className='-mt-8 flex items-end gap-3 px-4 pb-4'>
          <div className='relative size-20 overflow-hidden rounded border-4 border-card bg-secondary shadow-lg'>
            {avatarPreview ? (
              <Image src={avatarPreview} alt='Community profile preview' fill unoptimized className='object-cover' />
            ) : (
              <span
                className='grid size-full place-items-center text-2xl font-black text-primary-foreground'
                style={{ backgroundColor: previewColor }}
              >
                {community.label.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className='min-w-0 pb-1'>
            <p className='font-mono text-xs uppercase tracking-wide text-muted-foreground'>r/{community.slug}</p>
            <p className='truncate text-lg font-bold'>{community.label}</p>
          </div>
        </div>
      </div>
      <div className='grid gap-4 lg:grid-cols-2'>
        <FormField
          htmlFor='community-avatar'
          label='Profile picture'
          error={mediaForm.formState.errors.avatar?.message}
        >
          <div className='flex gap-2'>
            <Input
              id='community-avatar'
              type='file'
              accept={IMAGE_ACCEPT}
              disabled={savingMedia}
              aria-invalid={Boolean(mediaForm.formState.errors.avatar)}
              name={avatarRegistration.name}
              onBlur={avatarRegistration.onBlur}
              onChange={avatarRegistration.onChange}
              onClick={() => clearMedia('avatar')}
              ref={node => {
                avatarRegistration.ref(node);
                avatarInputRef.current = node;
              }}
            />
            {mediaPreview.avatar ? (
              <Button
                type='button'
                variant='outline'
                size='icon-lg'
                disabled={savingMedia}
                onClick={() => clearMedia('avatar')}
                aria-label='Remove selected profile picture'
              >
                <X />
              </Button>
            ) : null}
          </div>
        </FormField>
        <FormField htmlFor='community-cover' label='Cover photo' error={mediaForm.formState.errors.cover?.message}>
          <div className='flex gap-2'>
            <Input
              id='community-cover'
              type='file'
              accept={IMAGE_ACCEPT}
              disabled={savingMedia}
              aria-invalid={Boolean(mediaForm.formState.errors.cover)}
              name={coverRegistration.name}
              onBlur={coverRegistration.onBlur}
              onChange={coverRegistration.onChange}
              onClick={() => clearMedia('cover')}
              ref={node => {
                coverRegistration.ref(node);
                coverInputRef.current = node;
              }}
            />
            {mediaPreview.cover ? (
              <Button
                type='button'
                variant='outline'
                size='icon-lg'
                disabled={savingMedia}
                onClick={() => clearMedia('cover')}
                aria-label='Remove selected cover photo'
              >
                <X />
              </Button>
            ) : null}
          </div>
        </FormField>
      </div>
      <Button
        type='submit'
        disabled={savingMedia}
        isLoading={savingMedia}
        loadingText='Uploading...'
        className='celestia-primary-action h-11 w-full sm:w-auto'
      >
        <ImagePlus /> Upload media
      </Button>
    </form>
  );
};
