'use client';
import { createPostAction } from '@/lib/actions/posts';
import { useActionState, useRef, useState } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Image as ImageIcon, Link2, Send } from 'lucide-react';
import type { Community } from '@/lib/types';
import Link from 'next/link';

export function SubmitPostForm({ communities, defaultCommunitySlug }: { communities: Community[]; defaultCommunitySlug?: string }) {
  const [state, action, pending] = useActionState(createPostAction, null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  return (
    <form action={action} className='celestia-card space-y-4 p-4 md:p-5'>
      <div className='space-y-2'>
        <Label htmlFor='title' className='text-sm text-card-foreground'>Post title</Label>
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
        <Label htmlFor='body' className='text-sm text-card-foreground'>Body</Label>
        <Textarea
          id='body'
          name='body'
          rows={5}
          placeholder='Add context, details, links...'
          className='resize-y rounded-xl border-border bg-secondary/80 px-4 py-3 leading-6 focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='communitySlug' className='text-sm text-card-foreground'>Community</Label>
        <select
          id='communitySlug'
          name='communitySlug'
          required
          defaultValue={defaultCommunitySlug && communities.some(community => community.slug === defaultCommunitySlug) ? defaultCommunitySlug : ''}
          disabled={communities.length === 0 || pending}
          className='h-10 w-full rounded-xl border border-border bg-secondary/80 px-4 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60'
        >
          <option value='' disabled>Select a community</option>
          {communities.map(community => (
            <option key={community.slug} value={community.slug}>r/{community.slug} — {community.label}</option>
          ))}
        </select>
        <p className='text-xs text-muted-foreground'>You can post in communities you have joined. Communities are no longer created from post text.</p>
        {communities.length === 0 ? <p className='text-xs text-primary'>Join a community first, or <Link href='/communities/new' className='font-semibold underline underline-offset-2'>create one</Link>.</p> : null}
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <input
          ref={imageInput}
          id='image'
          name='image'
          type='file'
          accept='image/png,image/jpeg,image/webp,image/gif'
          className='sr-only'
          onChange={event => setImageName(event.target.files?.[0]?.name ?? null)}
        />
        <button
          type='button'
          onClick={() => imageInput.current?.click()}
          className='flex min-w-0 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground celestia-hover-surface'
        >
          <ImageIcon className='size-4 text-primary' />
          <span className='truncate'>{imageName ?? 'Add image'}</span>
        </button>
        <button type='button' className='flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground celestia-hover-surface'>
          <Link2 className='size-4 text-accent' />
          Attach link
        </button>
      </div>

      {state?.error ? (
        <p className='text-sm text-destructive' role='alert'>
          {state.error}
        </p>
      ) : null}

      <Button type='submit' disabled={pending || communities.length === 0} className='celestia-primary-action h-10 w-full rounded-xl'>
        <Send className='size-4' />
        {pending ? 'Posting...' : 'Create Post'}
      </Button>
    </form>
  );
}
