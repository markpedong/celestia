'use client';

import { useEffect, useRef, useState, useTransition, type FC } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useFormSchema from '@/hooks/useFormSchema';
import { IMAGE_ACCEPT } from '@/constants';
import { Button } from '../ui/button';
import FormField from '../ui/form-field';
import { Input } from '../ui/input';
import { ImagePlus, Save } from 'lucide-react';
import { Community } from '@/lib/types';
import useFormValidate from '@/hooks/useFormValidate';
import z from 'zod';
import { useUpdateCommunity } from '@/hooks/useQueries';

type CommunityMediaValues = {
  avatar?: FileList;
  cover?: FileList;
};

const CommunitySettingsForm: FC<{ community: Community }> = ({ community }) => {
  const router = useRouter();
  const { communitySettingsSchema } = useFormSchema();
  const [savingMedia, startSavingMedia] = useTransition();
  const [mediaPreview, setMediaPreview] = useState<Partial<Record<'avatar' | 'cover', string>>>({});
  const mediaPreviewRef = useRef(mediaPreview);
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
  const mediaForm = useFormValidate<CommunityMediaValues>({
    defaultValues: { avatar: undefined, cover: undefined },
  });
  const avatarPreview = mediaPreview.avatar ?? community.avatarUrl;
  const coverPreview = mediaPreview.cover ?? community.coverUrl;

  const onSubmit = (values: z.infer<typeof communitySettingsSchema>) => {
    mutate({ ...values, slug: community.slug });
  };

  useEffect(() => {
    mediaPreviewRef.current = mediaPreview;
  }, [mediaPreview]);

  useEffect(() => () => {
    Object.values(mediaPreviewRef.current).forEach(url => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    });
  }, []);

  const previewMedia = (kind: 'avatar' | 'cover', file?: File) => {
    if (!file) return;
    setMediaPreview(current => {
      const previousUrl = current[kind];
      if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
      return { ...current, [kind]: URL.createObjectURL(file) };
    });
  };

  const submitMedia = async (values: CommunityMediaValues) => {
    startSavingMedia(async () => {
      const formData = new FormData();
      formData.set('slug', community.slug);
      if (values.avatar?.[0]) formData.set('avatar', values.avatar[0]);
      if (values.cover?.[0]) formData.set('cover', values.cover[0]);

      const response = await fetch('/api/community', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
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
    });
  };

  return (
    <div className='space-y-5'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={onFormKeyDown}
        className='celestia-card space-y-5 p-5 md:p-6'
        noValidate
      >
        <input type='hidden' name='slug' value={community.slug} />
        <div className='rounded border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground'>
          Community URL: <span className='font-semibold text-foreground'>r/{community.slug}</span>. URLs stay fixed
          after creation.
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
          rows={5}
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
          loadingText='Saving…'
          className='celestia-primary-action w-full h-11'
        >
          <Save /> Save community settings
        </Button>
      </form>

      <form
        onSubmit={mediaForm.handleSubmit(submitMedia)}
        onKeyDown={mediaForm.onFormKeyDown}
        className='celestia-card space-y-5 p-5 md:p-6'
        noValidate
      >
        <div>
          <h2 className='text-base font-semibold'>Community media</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Upload the profile image and cover photo for r/{community.slug}.</p>
        </div>
        <div className='space-y-4'>
          <div className='relative aspect-3/1 overflow-hidden rounded border border-border bg-secondary/80'>
            {coverPreview ? (
              <Image src={coverPreview} alt='Community cover preview' fill unoptimized className='object-cover' />
            ) : (
              <div
                className='size-full'
                style={{ background: `linear-gradient(135deg, ${previewColor}55, transparent)` }}
              />
            )}
          </div>
          <div className='relative size-24 overflow-hidden rounded-full border-4 border-card bg-secondary shadow-lg'>
            {avatarPreview ? (
              <Image src={avatarPreview} alt='Community profile preview' fill unoptimized className='object-cover' />
            ) : (
              <span
                className='grid size-full place-items-center text-3xl font-black text-primary-foreground'
                style={{ backgroundColor: previewColor }}
              >
                {community.label.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <FormField
          htmlFor='community-avatar'
          label='Profile picture'
          error={mediaForm.formState.errors.avatar?.message}
        >
          <Input
            id='community-avatar'
            type='file'
            accept={IMAGE_ACCEPT}
            disabled={savingMedia}
            aria-invalid={Boolean(mediaForm.formState.errors.avatar)}
            {...mediaForm.register('avatar', {
              onChange: event => previewMedia('avatar', event.target.files?.[0]),
            })}
          />
        </FormField>
        <FormField
          htmlFor='community-cover'
          label='Cover photo'
          error={mediaForm.formState.errors.cover?.message}
        >
          <Input
            id='community-cover'
            type='file'
            accept={IMAGE_ACCEPT}
            disabled={savingMedia}
            aria-invalid={Boolean(mediaForm.formState.errors.cover)}
            {...mediaForm.register('cover', {
              onChange: event => previewMedia('cover', event.target.files?.[0]),
            })}
          />
        </FormField>
        <Button
          type='submit'
          disabled={savingMedia}
          isLoading={savingMedia}
          loadingText='Uploading…'
          className='celestia-primary-action w-full h-11'
        >
          <ImagePlus /> Upload community media
        </Button>
      </form>
    </div>
  );
};

export default CommunitySettingsForm;
