'use client';
import type { FC } from 'react';
import { createPostAction } from '@/lib/actions/posts';
import { useServerActionForm } from '@/hooks/use-server-action-form';
import useFormSchema from '@/hooks/useFormSchema';
import { Label } from '../ui/label';
import FormField from '../ui/form-field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';
import type { SubmitPostFormProps } from '@/lib/types';
import { ImageUploadField } from './image-upload-field';
import { MAX_POST_BODY_LENGTH, MAX_POST_TITLE_LENGTH } from '@/constants';
import { useState } from 'react';

export const SubmitPostForm: FC<SubmitPostFormProps> = ({ communities, defaultCommunitySlug }) => {
  const [uploadingImages, setUploadingImages] = useState(false);
  const { postSchema } = useFormSchema();
  const selectedCommunity =
    defaultCommunitySlug && communities.some(community => community.slug === defaultCommunitySlug)
      ? defaultCommunitySlug
      : '';
  const {
    form: {
      register,
      formState: { errors, isSubmitted, isValid, touchedFields },
    },
    onFormKeyDown,
    onSubmit,
    pending,
  } = useServerActionForm(createPostAction, null, postSchema, {
    title: '',
    body: '',
    communitySlug: selectedCommunity,
  });
  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className='celestia-card space-y-4 p-4 md:p-5' noValidate>
      <FormField
        htmlFor='title'
        label='Post title'
        labelClassName='text-card-foreground'
        error={errors.title && (touchedFields.title || isSubmitted) ? errors.title.message : undefined}
      >
        <Input
          id='title'
          maxLength={MAX_POST_TITLE_LENGTH}
          placeholder='What do you want to discuss?'
          className='h-10 rounded border-border bg-secondary/80 px-4 text-[15px] focus-visible:border-primary/40 focus-visible:ring-primary/20'
          aria-invalid={Boolean(errors.title && (touchedFields.title || isSubmitted))}
          {...register('title')}
        />
      </FormField>
      <FormField
        htmlFor='body'
        label='Body'
        labelClassName='text-card-foreground'
        error={errors.body && (touchedFields.body || isSubmitted) ? errors.body.message : undefined}
      >
        <Textarea
          id='body'
          rows={5}
          maxLength={MAX_POST_BODY_LENGTH}
          placeholder='Add context, details, links...'
          className='resize-y rounded border-border bg-secondary/80 px-4 py-3 leading-6 focus-visible:border-primary/40 focus-visible:ring-primary/20'
          aria-invalid={Boolean(errors.body && (touchedFields.body || isSubmitted))}
          {...register('body')}
        />
      </FormField>
      <FormField
        htmlFor='communitySlug'
        label='Community'
        labelClassName='text-card-foreground'
        hint='You can post in communities you have joined. Communities are no longer created from post text.'
        error={
          errors.communitySlug && (touchedFields.communitySlug || isSubmitted)
            ? errors.communitySlug.message
            : undefined
        }
      >
        <select
          id='communitySlug'
          disabled={communities.length === 0 || pending}
          className='h-10 w-full rounded border border-border bg-secondary/80 px-4 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60'
          aria-invalid={Boolean(errors.communitySlug && (touchedFields.communitySlug || isSubmitted))}
          {...register('communitySlug')}
        >
          <option value='' disabled>
            Select a community
          </option>
          {communities.map(community => (
            <option key={community.slug} value={community.slug}>
              r/{community.slug} — {community.label}
            </option>
          ))}
        </select>
      </FormField>

      {communities.length === 0 ? (
        <p className='rounded border border-dashed border-primary/25 bg-primary/5 px-3 py-2 text-sm text-muted-foreground'>
          Join a community before creating a post.
        </p>
      ) : null}

      <div className='space-y-2'>
        <Label>
          Images <span className='text-muted-foreground'>(optional, up to 4)</span>
        </Label>
        <ImageUploadField name='images' multiple onUploadingChange={setUploadingImages} />
      </div>

      <Button
        type='submit'
        disabled={communities.length === 0 || !isValid || uploadingImages}
        isLoading={pending || uploadingImages}
        loadingText={uploadingImages ? 'Optimizing images...' : 'Posting...'}
        className='celestia-primary-action h-10 w-full rounded'
      >
        <Send />
        Create Post
      </Button>
    </form>
  );
};
