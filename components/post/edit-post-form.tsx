'use client';

import type { FC, FormEventHandler } from 'react';
import type { EditPostFormProps } from '@/lib/types';
import useFormSchema from '@/hooks/useFormSchema';
import useFormValidate from '@/hooks/useFormValidate';
import { Button } from '../ui/button';
import FormField from '../ui/form-field';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ImageUploadField } from './image-upload-field';
import { Save } from 'lucide-react';
import { MAX_POST_BODY_LENGTH, MAX_POST_TITLE_LENGTH } from '@/constants';
import { useState } from 'react';
import { useUpdatePost } from '@/hooks/useQueries';

export const EditPostForm: FC<EditPostFormProps> = ({ post }) => {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { editPostSchema } = useFormSchema();
  const updatePost = useUpdatePost();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitted, isValid, touchedFields },
    onFormKeyDown,
  } = useFormValidate({
    schema: editPostSchema,
    defaultValues: { title: post.title, body: post.body },
  });
  const pending = updatePost.isPending || isNavigating;
  const onSubmit: FormEventHandler<HTMLFormElement> = event => {
    const formData = new FormData(event.currentTarget);
    void handleSubmit(values => {
      updatePost.mutate({
        postID: post.id,
        ...values,
        images: JSON.parse(String(formData.get('images') ?? '[]')) as string[],
        removeImages: String(formData.get('removeImages') ?? '') === 'true',
      }, {
        onSuccess: result => {
          if (result && !('error' in result)) setIsNavigating(true);
        },
        onError: () => setIsNavigating(false),
      });
    })(event);
  };

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className='celestia-card space-y-5 p-5 md:p-6' noValidate>
      <input type='hidden' name='postID' value={post.id} />
      <FormField
        htmlFor='title'
        label='Post title'
        error={errors.title && (touchedFields.title || isSubmitted) ? errors.title.message : undefined}
      >
        <Input
          id='title'
          maxLength={MAX_POST_TITLE_LENGTH}
          className='bg-secondary/80'
          aria-invalid={Boolean(errors.title && (touchedFields.title || isSubmitted))}
          {...register('title')}
        />
      </FormField>
      <FormField
        htmlFor='body'
        label='Body'
        error={errors.body && (touchedFields.body || isSubmitted) ? errors.body.message : undefined}
      >
        <Textarea
          id='body'
          rows={8}
          maxLength={MAX_POST_BODY_LENGTH}
          className='resize-y bg-secondary/80 leading-6'
          aria-invalid={Boolean(errors.body && (touchedFields.body || isSubmitted))}
          {...register('body')}
        />
      </FormField>
      <div className='space-y-2'>
        <Label>
          Images <span className='text-muted-foreground'>(optional, up to 4)</span>
        </Label>
        <ImageUploadField initialImageUrls={post.imageUrls} name='images' multiple onUploadingChange={setUploadingImages} />
      </div>
      <Button
        type='submit'
        disabled={!isValid || uploadingImages}
        isLoading={pending || uploadingImages}
        loadingText={uploadingImages ? 'Optimizing images...' : 'Saving…'}
        className='celestia-primary-action w-full rounded'
      >
        <Save /> Save changes
      </Button>
    </form>
  );
};
