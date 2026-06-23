'use client';

import { createCommunityAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { createCommunitySchema } from '@/lib/form-schemas';
import { useServerActionForm } from '@/hooks/use-server-action-form';
import { MAX_COMMUNITY_DESCRIPTION_LENGTH, MAX_COMMUNITY_NAME_LENGTH, MAX_COMMUNITY_SLUG_LENGTH } from '@/constants';
import { Plus } from 'lucide-react';

export const CreateCommunityForm = () => {
  const {
    form: {
      register,
      formState: { errors, isSubmitted, isValid, touchedFields },
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

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className='celestia-card space-y-5 p-5 md:p-6' noValidate>
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
        <div className='flex items-center rounded border border-border bg-secondary/80 px-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20'>
          <span className='shrink-0 text-sm text-muted-foreground'>r/</span>
          <Input
            id='slug'
            maxLength={MAX_COMMUNITY_SLUG_LENGTH}
            placeholder='indie_makers'
            className='h-11 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0'
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
          rows={4}
          placeholder='What conversations belong here?'
          className='resize-y bg-secondary/80'
          aria-invalid={Boolean(errors.description && (touchedFields.description || isSubmitted))}
          {...register('description')}
        />
      </FormField>
      <FormField
        htmlFor='hashColor'
        label='Community color'
        error={errors.hashColor && (touchedFields.hashColor || isSubmitted) ? errors.hashColor.message : undefined}
      >
        <input
          id='hashColor'
          type='color'
          className='h-11 w-full cursor-pointer rounded border border-border bg-secondary/80 p-1'
          aria-label='Community color'
          {...register('hashColor')}
        />
      </FormField>
      <Button type='submit' disabled={pending || !isValid} className='celestia-primary-action h-11 w-full rounded'>
        <Plus className='size-4' />
        {pending ? 'Creating community…' : 'Create community'}
      </Button>
    </form>
  );
};
