'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createCommunityAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormField from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { useServerActionForm } from '@/hooks/use-server-action-form';
import useFormSchema from '@/hooks/useFormSchema';
import {
  IMAGE_ACCEPT,
  MAX_COMMUNITY_DESCRIPTION_LENGTH,
  MAX_COMMUNITY_NAME_LENGTH,
  MAX_COMMUNITY_SLUG_LENGTH,
} from '@/constants';
import { ImagePlus, Plus, X } from 'lucide-react';

export const CreateCommunityForm = () => {
  const { createCommunitySchema } = useFormSchema();
  const [mediaPreview, setMediaPreview] = useState<Partial<Record<'avatar' | 'cover', string>>>({});
  const mediaPreviewRef = useRef(mediaPreview);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const {
    form: {
      register,
      formState: { errors, isSubmitted, isValid, touchedFields },
      watch,
    },
    onFormKeyDown,
    onSubmit,
    pending,
  } = useServerActionForm(createCommunityAction, null, createCommunitySchema, {
    label: '',
    slug: '',
    description: '',
    hashColor: '#8b5cf6',
  });
  const label = watch('label');
  const hashColor = watch('hashColor');
  const previewColor = /^#[0-9a-f]{6}$/i.test(hashColor) ? hashColor : '#8b5cf6';
  const previewInitial = label.trim().slice(0, 1).toUpperCase() || 'C';

  useEffect(() => {
    mediaPreviewRef.current = mediaPreview;
  }, [mediaPreview]);

  useEffect(
    () => () => {
      Object.values(mediaPreviewRef.current).forEach(url => {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    },
    []
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
    setMediaPreview(current => {
      const previousUrl = current[kind];
      if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
      const next = { ...current };
      delete next[kind];
      return next;
    });
  };
  const avatarRegistration = register('avatar', {
    onChange: event => previewMedia('avatar', event.target.files?.[0]),
  });
  const coverRegistration = register('cover', {
    onChange: event => previewMedia('cover', event.target.files?.[0]),
  });

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className='celestia-card overflow-hidden' noValidate>
      <div className='grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]'>
        <div className='border-b border-border bg-muted/25 p-5 lg:border-r lg:border-b-0 md:p-6'>
          <div>
            <p className='celestia-panel-label'>Live preview</p>
            <h2 className='mt-2 text-xl font-bold tracking-tight'>{label.trim() || 'Your community'}</h2>
            <p className='mt-1 text-sm text-muted-foreground'>Shape the identity members will see first.</p>
          </div>
          <div className='mt-5 overflow-hidden rounded border border-border bg-card shadow-2xl shadow-background/20'>
            <div className='relative aspect-3/1 overflow-hidden bg-secondary/80'>
              {mediaPreview.cover ? (
                <Image
                  src={mediaPreview.cover}
                  alt='Community cover preview'
                  fill
                  unoptimized
                  className='object-cover'
                />
              ) : (
                <div
                  className='size-full'
                  style={{
                    background: `
                      radial-gradient(circle at 18% 24%, ${previewColor}90, transparent 34%),
                      linear-gradient(135deg, ${previewColor}66, color-mix(in srgb, var(--accent) 22%, transparent))
                    `,
                  }}
                />
              )}
              <div className='absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(5,8,20,0.68)_100%)]' />
            </div>
            <div className='px-4 pb-4'>
              <div className='-mt-8 flex items-end gap-3'>
                <div className='relative size-20 overflow-hidden rounded border-4 border-card bg-secondary shadow-lg'>
                  {mediaPreview.avatar ? (
                    <Image
                      src={mediaPreview.avatar}
                      alt='Community profile preview'
                      fill
                      unoptimized
                      className='object-cover'
                    />
                  ) : (
                    <span
                      className='grid size-full place-items-center text-2xl font-black text-primary-foreground'
                      style={{ backgroundColor: previewColor }}
                    >
                      {previewInitial}
                    </span>
                  )}
                </div>
                <div className='min-w-0 pb-1'>
                  <p className='font-mono text-xs uppercase tracking-wide text-muted-foreground'>r/community_url</p>
                  <p className='truncate text-lg font-bold'>{label.trim() || 'Community name'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className='mt-5 grid gap-4'>
            <FormField htmlFor='community-avatar' label='Profile picture'>
              <div className='flex gap-2'>
                <Input
                  id='community-avatar'
                  type='file'
                  accept={IMAGE_ACCEPT}
                  disabled={pending}
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
                    disabled={pending}
                    onClick={() => clearMedia('avatar')}
                    aria-label='Remove profile picture'
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
            </FormField>
            <FormField htmlFor='community-cover' label='Cover photo'>
              <div className='flex gap-2'>
                <Input
                  id='community-cover'
                  type='file'
                  accept={IMAGE_ACCEPT}
                  disabled={pending}
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
                    disabled={pending}
                    onClick={() => clearMedia('cover')}
                    aria-label='Remove cover photo'
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
            </FormField>
          </div>
        </div>

        <div className='space-y-5 p-5 md:p-6'>
          <FormField
            htmlFor='label'
            label='Community name'
            error={errors.label && (touchedFields.label || isSubmitted) ? errors.label.message : undefined}
          >
            <Input
              id='label'
              maxLength={MAX_COMMUNITY_NAME_LENGTH}
              placeholder='e.g. Indie Makers'
              className='h-11 bg-secondary/80'
              aria-invalid={Boolean(errors.label && (touchedFields.label || isSubmitted))}
              {...register('label')}
            />
          </FormField>
          <FormField
            htmlFor='slug'
            label='Community URL'
            hint='Use letters, numbers, spaces, hyphens, or underscores. The URL is permanent.'
            error={errors.slug && (touchedFields.slug || isSubmitted) ? errors.slug.message : undefined}
          >
            <div className='flex h-11 items-center rounded border border-border bg-secondary/80 px-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20'>
              <span className='shrink-0 text-sm text-muted-foreground'>r/</span>
              <Input
                id='slug'
                maxLength={MAX_COMMUNITY_SLUG_LENGTH}
                placeholder='indie_makers'
                className='h-10 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0'
                aria-invalid={Boolean(errors.slug && (touchedFields.slug || isSubmitted))}
                {...register('slug')}
              />
            </div>
          </FormField>
          <FormField
            htmlFor='description'
            label={
              <>
                Description <span className='text-muted-foreground'>(optional)</span>
              </>
            }
            error={
              errors.description && (touchedFields.description || isSubmitted) ? errors.description.message : undefined
            }
          >
            <Textarea
              id='description'
              maxLength={MAX_COMMUNITY_DESCRIPTION_LENGTH}
              rows={6}
              placeholder='What conversations belong here?'
              className='resize-y bg-secondary/80 leading-6'
              aria-invalid={Boolean(errors.description && (touchedFields.description || isSubmitted))}
              {...register('description')}
            />
          </FormField>
          <FormField
            htmlFor='hashColor'
            label='Community color'
            error={errors.hashColor && (touchedFields.hashColor || isSubmitted) ? errors.hashColor.message : undefined}
          >
            <div className='flex items-center gap-3'>
              <input
                id='hashColor'
                type='color'
                className='size-11 shrink-0 cursor-pointer rounded border border-border bg-secondary/80 p-1'
                aria-label='Community color'
                {...register('hashColor')}
              />
              <Input
                value={previewColor}
                readOnly
                className='max-w-36 bg-secondary/80 font-mono uppercase'
                aria-label='Selected community color'
              />
            </div>
          </FormField>
          <Button
            type='submit'
            disabled={!isValid}
            isLoading={pending}
            loadingText='Creating community…'
            className='celestia-primary-action h-11 w-full rounded'
          >
            {mediaPreview.avatar || mediaPreview.cover ? <ImagePlus /> : <Plus />}
            Create community
          </Button>
        </div>
      </div>
    </form>
  );
};
