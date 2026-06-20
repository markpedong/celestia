'use client';

import { updatePostAction } from '@/lib/actions/posts';
import type { EditPostFormProps } from '@/lib/types';
import { useActionState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImageUploadField } from './image-upload-field';
import { Save } from 'lucide-react';

export function EditPostForm({ post }: EditPostFormProps) {
  const [state, action, pending] = useActionState(updatePostAction, null);

  return (
    <form action={action} className='celestia-card space-y-5 p-5 md:p-6'>
      <input type='hidden' name='postId' value={post.id} />
      <div className='space-y-2'>
        <Label htmlFor='title'>Post title</Label>
        <Input
          id='title'
          name='title'
          required
          minLength={4}
          maxLength={300}
          defaultValue={post.title}
          className='h-11 bg-secondary/80'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='body'>Body</Label>
        <Textarea
          id='body'
          name='body'
          rows={8}
          defaultValue={post.body}
          className='resize-y bg-secondary/80 leading-6'
        />
      </div>
      <div className='space-y-2'>
        <Label>
          Images <span className='text-muted-foreground'>(optional, up to 4)</span>
        </Label>
        <ImageUploadField initialImageUrls={post.imageUrls} name='images' multiple />
      </div>
      {state?.error ? (
        <p
          className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive'
          role='alert'
        >
          {state.error}
        </p>
      ) : null}
      <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded'>
        <Save className='size-4' /> {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
