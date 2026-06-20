'use client';

import { updatePostAction } from '@/lib/actions/posts';
import type { EditPostFormProps, Post } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useActionState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImageUploadField } from './image-upload-field';
import { Save } from 'lucide-react';

async function fetchPost(postId: string): Promise<Post> {
  const response = await fetch(`/api/posts/${postId}`);
  if (!response.ok) throw new Error('Unable to refresh post data.');
  return response.json() as Promise<Post>;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const [state, action, pending] = useActionState(updatePostAction, null);
  const { data } = useQuery({
    queryKey: ['post', post.id],
    queryFn: () => fetchPost(post.id),
    initialData: post,
  });

  return (
    <form action={action} className='celestia-card space-y-5 p-5 md:p-6'>
      <input type='hidden' name='postId' value={data.id} />
      <div className='space-y-2'>
        <Label htmlFor='title'>Post title</Label>
        <Input id='title' name='title' required minLength={4} maxLength={300} defaultValue={data.title} className='h-11 bg-secondary/80' />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='body'>Body</Label>
        <Textarea id='body' name='body' rows={8} defaultValue={data.body} className='resize-y bg-secondary/80 leading-6' />
      </div>
      <div className='space-y-2'>
        <Label>Image <span className='text-muted-foreground'>(optional)</span></Label>
        <ImageUploadField initialImageUrl={data.imageUrl} />
      </div>
      {state?.error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{state.error}</p> : null}
      <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded-xl'>
        <Save className='size-4' /> {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
