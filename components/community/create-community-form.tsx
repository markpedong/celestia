'use client';

import type { FC } from 'react';
import { createCommunityAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCommunitySchema } from '@/lib/form-schemas';
import { useServerActionForm } from '@/hooks/use-server-action-form';
import { MAX_COMMUNITY_DESCRIPTION_LENGTH, MAX_COMMUNITY_NAME_LENGTH, MAX_COMMUNITY_SLUG_LENGTH } from '@/lib/constants';
import { Plus } from 'lucide-react';

export const CreateCommunityForm: FC<Record<never, never>> = () => {
  const { form: { register, formState: { errors, isSubmitted, isValid, touchedFields } }, onFormKeyDown, onSubmit, pending, state } = useServerActionForm(
    createCommunityAction,
    null,
    createCommunitySchema,
    { label: '', slug: '', description: '', hashColor: '#8b5cf6' },
  );

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className='celestia-card space-y-5 p-5 md:p-6' noValidate>
      <div className='space-y-2'>
        <Label htmlFor='label'>Community name</Label>
        <Input id='label' maxLength={MAX_COMMUNITY_NAME_LENGTH} placeholder='e.g. Indie Makers' className='h-11 bg-secondary/80' aria-invalid={Boolean(errors.label && (touchedFields.label || isSubmitted))} {...register('label')} />
        {errors.label && (touchedFields.label || isSubmitted) ? <p className='text-xs text-destructive'>{errors.label.message}</p> : null}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='slug'>Community URL</Label>
        <div className='flex items-center rounded border border-border bg-secondary/80 px-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20'>
          <span className='shrink-0 text-sm text-muted-foreground'>r/</span>
          <Input id='slug' maxLength={MAX_COMMUNITY_SLUG_LENGTH} placeholder='indie_makers' className='h-11 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0' aria-invalid={Boolean(errors.slug && (touchedFields.slug || isSubmitted))} {...register('slug')} />
        </div>
        <p className='text-xs text-muted-foreground'>Use letters, numbers, spaces, hyphens, or underscores. The URL is permanent.</p>
        {errors.slug && (touchedFields.slug || isSubmitted) ? <p className='text-xs text-destructive'>{errors.slug.message}</p> : null}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='description'>Description <span className='text-muted-foreground'>(optional)</span></Label>
        <Textarea id='description' maxLength={MAX_COMMUNITY_DESCRIPTION_LENGTH} rows={4} placeholder='What conversations belong here?' className='resize-y bg-secondary/80' aria-invalid={Boolean(errors.description && (touchedFields.description || isSubmitted))} {...register('description')} />
        {errors.description && (touchedFields.description || isSubmitted) ? <p className='text-xs text-destructive'>{errors.description.message}</p> : null}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='hashColor'>Community color</Label>
        <input id='hashColor' type='color' className='h-11 w-full cursor-pointer rounded border border-border bg-secondary/80 p-1' aria-label='Community color' {...register('hashColor')} />
        {errors.hashColor && (touchedFields.hashColor || isSubmitted) ? <p className='text-xs text-destructive'>{errors.hashColor.message}</p> : null}
      </div>
      {state?.error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{state.error}</p> : null}
      <Button type='submit' disabled={pending || !isValid} className='celestia-primary-action h-11 w-full rounded'>
        <Plus className='size-4' />
        {pending ? 'Creating community…' : 'Create community'}
      </Button>
    </form>
  );
};
