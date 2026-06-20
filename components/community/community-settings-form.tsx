'use client';

import type { FC } from 'react';
import { updateCommunityAction } from '@/lib/actions/communities';
import type { CommunitySettingsFormProps } from '@/lib/types';
import { communitySettingsSchema } from '@/lib/form-schemas';
import { useServerActionForm } from '@/hooks/use-server-action-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Save } from 'lucide-react';

export const CommunitySettingsForm: FC<CommunitySettingsFormProps> = ({ community }: CommunitySettingsFormProps) => {
  const { form: { register, formState: { errors } }, onSubmit, pending, state } = useServerActionForm(
    updateCommunityAction,
    null,
    communitySettingsSchema,
    { label: community.label, description: community.description, hashColor: community.hashColor },
  );

  return (
    <form onSubmit={onSubmit} className='celestia-card space-y-5 p-5 md:p-6' noValidate>
      <input type='hidden' name='slug' value={community.slug} />
      <div className='rounded border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground'>
        Community URL: <span className='font-semibold text-foreground'>r/{community.slug}</span>. URLs stay fixed after creation.
      </div>
      <div className='space-y-2'>
        <Label htmlFor='label'>Community name</Label>
        <Input id='label' maxLength={60} className='h-11 bg-secondary/80' aria-invalid={Boolean(errors.label)} {...register('label')} />
        {errors.label ? <p className='text-xs text-destructive'>{errors.label.message}</p> : null}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea id='description' rows={5} maxLength={500} className='resize-y bg-secondary/80 leading-6' aria-invalid={Boolean(errors.description)} {...register('description')} />
        {errors.description ? <p className='text-xs text-destructive'>{errors.description.message}</p> : null}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='hashColor'>Community color</Label>
        <div className='flex items-center gap-3'>
          <Input id='hashColor' className='h-11 max-w-40 bg-secondary/80 font-mono' aria-invalid={Boolean(errors.hashColor)} {...register('hashColor')} />
          <span className='size-8 rounded-full border border-border' style={{ backgroundColor: community.hashColor }} aria-hidden />
        </div>
        {errors.hashColor ? <p className='text-xs text-destructive'>{errors.hashColor.message}</p> : null}
      </div>
      {state?.error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{state.error}</p> : null}
      <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded'>
        <Save className='size-4' /> {pending ? 'Saving…' : 'Save community settings'}
      </Button>
    </form>
  );
};
