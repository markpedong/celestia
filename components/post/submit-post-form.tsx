'use client';
import type { FC } from 'react';
import { createPostAction } from '@/lib/actions/posts';
import { postSchema } from '@/lib/form-schemas';
import { useServerActionForm } from '@/hooks/use-server-action-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';
import type { SubmitPostFormProps } from '@/lib/types';
import { ImageUploadField } from './image-upload-field';

export const SubmitPostForm: FC<SubmitPostFormProps> = ({ communities, defaultCommunitySlug }: SubmitPostFormProps) => {
  const selectedCommunity = defaultCommunitySlug && communities.some(community => community.slug === defaultCommunitySlug)
    ? defaultCommunitySlug
    : '';
  const { form: { register, formState: { errors } }, onSubmit, pending, state } = useServerActionForm(
    createPostAction,
    null,
    postSchema,
    { title: '', body: '', communitySlug: selectedCommunity },
  );
  return (
    <form onSubmit={onSubmit} className='celestia-card space-y-4 p-4 md:p-5' noValidate>
      <div className='space-y-2'>
        <Label htmlFor='title' className='text-sm text-card-foreground'>
          Post title
        </Label>
        <Input
          id='title'
          maxLength={300}
          placeholder='What do you want to discuss?'
          className='h-10 rounded border-border bg-secondary/80 px-4 text-[15px] focus-visible:border-primary/40 focus-visible:ring-primary/20'
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />
        {errors.title ? <p className='text-xs text-destructive'>{errors.title.message}</p> : null}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='body' className='text-sm text-card-foreground'>
          Body
        </Label>
        <Textarea
          id='body'
          rows={5}
          maxLength={10_000}
          placeholder='Add context, details, links...'
          className='resize-y rounded border-border bg-secondary/80 px-4 py-3 leading-6 focus-visible:border-primary/40 focus-visible:ring-primary/20'
          aria-invalid={Boolean(errors.body)}
          {...register('body')}
        />
        {errors.body ? <p className='text-xs text-destructive'>{errors.body.message}</p> : null}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='communitySlug' className='text-sm text-card-foreground'>
          Community
        </Label>
        <select
          id='communitySlug'
          disabled={communities.length === 0 || pending}
          className='h-10 w-full rounded border border-border bg-secondary/80 px-4 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60'
          aria-invalid={Boolean(errors.communitySlug)}
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
        {errors.communitySlug ? <p className='text-xs text-destructive'>{errors.communitySlug.message}</p> : null}
        <p className='text-xs text-muted-foreground'>
          You can post in communities you have joined. Communities are no longer created from post text.
        </p>
      </div>

      <div className='space-y-2'>
        <Label>
          Images <span className='text-muted-foreground'>(optional, up to 4)</span>
        </Label>
        <ImageUploadField name='images' multiple />
      </div>

      {state?.error ? (
        <p className='text-sm text-destructive' role='alert'>
          {state.error}
        </p>
      ) : null}

      <Button
        type='submit'
        disabled={pending || communities.length === 0}
        className='celestia-primary-action h-10 w-full rounded'
      >
        <Send className='size-4' />
        {pending ? 'Posting...' : 'Create Post'}
      </Button>
    </form>
  );
};
