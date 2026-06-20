'use client';

import type { FC } from 'react';
import { updatePostAction } from '@/lib/actions/posts';
import type { EditPostFormProps } from '@/lib/types';
import { editPostSchema } from '@/lib/form-schemas';
import { useServerActionForm } from '@/hooks/use-server-action-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImageUploadField } from './image-upload-field';
import { Save } from 'lucide-react';
import { MAX_POST_BODY_LENGTH, MAX_POST_TITLE_LENGTH } from '@/lib/constants';

export const EditPostForm: FC<EditPostFormProps> = ({ post }: EditPostFormProps) => {
  const { form: { register, formState: { errors, isSubmitted, isValid, touchedFields } }, onFormKeyDown, onSubmit, pending, state } = useServerActionForm(
    updatePostAction,
    null,
    editPostSchema,
    { title: post.title, body: post.body },
  );

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className='celestia-card space-y-5 p-5 md:p-6' noValidate>
      <input type='hidden' name='postId' value={post.id} />
      <div className='space-y-2'>
        <Label htmlFor='title'>Post title</Label>
        <Input
          id='title'
          maxLength={MAX_POST_TITLE_LENGTH}
          className='h-11 bg-secondary/80'
          aria-invalid={Boolean(errors.title && (touchedFields.title || isSubmitted))}
          {...register('title')}
        />
        {errors.title && (touchedFields.title || isSubmitted) ? <p className='text-xs text-destructive'>{errors.title.message}</p> : null}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='body'>Body</Label>
        <Textarea
          id='body'
          rows={8}
          maxLength={MAX_POST_BODY_LENGTH}
          className='resize-y bg-secondary/80 leading-6'
          aria-invalid={Boolean(errors.body && (touchedFields.body || isSubmitted))}
          {...register('body')}
        />
        {errors.body && (touchedFields.body || isSubmitted) ? <p className='text-xs text-destructive'>{errors.body.message}</p> : null}
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
      <Button type='submit' disabled={pending || !isValid} className='celestia-primary-action h-11 w-full rounded'>
        <Save className='size-4' /> {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
};
