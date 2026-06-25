'use client';

import type { FC } from 'react';
import useFormSchema from '@/hooks/useFormSchema';
import { MAX_COMMUNITY_DESCRIPTION_LENGTH, MAX_COMMUNITY_NAME_LENGTH } from '@/constants';
import { Button } from '../ui/button';
import FormField from '../ui/form-field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Save } from 'lucide-react';
import { Community } from '@/lib/types';
import useFormValidate from '@/hooks/useFormValidate';
import z from 'zod';
import { useUpdateCommunity } from '@/hooks/useQueries';

const CommunitySettingsForm: FC<{ community: Community }> = ({ community }) => {
  const { communitySettingsSchema } = useFormSchema();
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitted, isValid, touchedFields },
    onFormKeyDown,
  } = useFormValidate({
    schema: communitySettingsSchema,
    defaultValues: { label: community.label, description: community.description, hashColor: community.hashColor },
  });
  const { mutate } = useUpdateCommunity();

  const onSubmit = (values: z.infer<typeof communitySettingsSchema>) => {
    mutate({ ...values, slug: community.slug });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={onFormKeyDown}
      className='celestia-card space-y-5 p-5 md:p-6'
      noValidate
    >
      <FormField label='Community slug' {...register('label')} />
      <input type='hidden' name='slug' value={community.slug} />
      <div className='rounded border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground'>
        Community URL: <span className='font-semibold text-foreground'>r/{community.slug}</span>. URLs stay fixed after
        creation.
      </div>
      <FormField
        htmlFor='label'
        label='Community name'
        error={errors.label && (touchedFields.label || isSubmitted) ? errors.label.message : undefined}
      >
        <Input
          id='label'
          maxLength={MAX_COMMUNITY_NAME_LENGTH}
          className='bg-secondary/80'
          aria-invalid={Boolean(errors.label && (touchedFields.label || isSubmitted))}
          {...register('label')}
        />
      </FormField>
      <FormField
        htmlFor='description'
        label='Description'
        error={
          errors.description && (touchedFields.description || isSubmitted) ? errors.description.message : undefined
        }
      >
        <Textarea
          id='description'
          rows={5}
          maxLength={MAX_COMMUNITY_DESCRIPTION_LENGTH}
          className='resize-y bg-secondary/80 leading-6'
          aria-invalid={Boolean(errors.description && (touchedFields.description || isSubmitted))}
          {...register('description')}
        />
      </FormField>
      <FormField
        htmlFor='hashColor'
        label='Community color'
        error={errors.hashColor && (touchedFields.hashColor || isSubmitted) ? errors.hashColor.message : undefined}
      >
        <div className='flex items-center gap-3'>
          <Input
            id='hashColor'
            className='max-w-40 bg-secondary/80 font-mono'
            aria-invalid={Boolean(errors.hashColor && (touchedFields.hashColor || isSubmitted))}
            {...register('hashColor')}
          />
          <span
            className='size-8 rounded-full border border-border'
            style={{ backgroundColor: community.hashColor }}
            aria-hidden
          />
        </div>
      </FormField>
      <Button
        type='submit'
        disabled={!isValid}
        loadingText='Saving…'
        className='celestia-primary-action w-full h-11'
      >
        <Save /> Save community settings
      </Button>
    </form>
  );
};

export default CommunitySettingsForm;
