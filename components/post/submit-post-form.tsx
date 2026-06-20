'use client';
import { createPostAction } from '@/lib/actions/posts';
import { useActionState } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';
import type { SubmitPostFormProps } from '@/lib/types';
import { ImageUploadField } from './image-upload-field';

export function SubmitPostForm({ communities, defaultCommunitySlug }: SubmitPostFormProps) {
  const [state, action, pending] = useActionState(createPostAction, null);
  return (
    <form action={action} className='celestia-card space-y-4 p-4 md:p-5'>
      <div className='space-y-2'>
        <Label htmlFor='title' className='text-sm text-card-foreground'>
          Post title
        </Label>
        <Input
          id='title'
          name='title'
          required
          minLength={4}
          maxLength={300}
          placeholder='What do you want to discuss?'
          className='h-10 rounded-xl border-border bg-secondary/80 px-4 text-[15px] focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='body' className='text-sm text-card-foreground'>
          Body
        </Label>
        <Textarea
          id='body'
          name='body'
          rows={5}
          placeholder='Add context, details, links...'
          className='resize-y rounded-xl border-border bg-secondary/80 px-4 py-3 leading-6 focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='communitySlug' className='text-sm text-card-foreground'>
          Community
        </Label>
        <select
          id='communitySlug'
          name='communitySlug'
          required
          defaultValue={
            defaultCommunitySlug && communities.some(community => community.slug === defaultCommunitySlug)
              ? defaultCommunitySlug
              : ''
          }
          disabled={communities.length === 0 || pending}
          className='h-10 w-full rounded-xl border border-border bg-secondary/80 px-4 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60'
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
        className='celestia-primary-action h-10 w-full rounded-xl'
      >
        <Send className='size-4' />
        {pending ? 'Posting...' : 'Create Post'}
      </Button>
    </form>
  );
}
