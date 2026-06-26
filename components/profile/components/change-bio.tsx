import DialogActions from '@/components/ui/dialog-actions';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import { Textarea } from '@/components/ui/textarea';
import useFormSchema from '@/hooks/useFormSchema';
import useFormValidate from '@/hooks/useFormValidate';
import { useGetProfile, useUpdateProfile } from '@/hooks/useQueries';
import { TChangeProfile } from '@/lib/types';
import { FC } from 'react';
import z from 'zod';

const ChangeBio: FC<TChangeProfile> = ({ open, setActiveEditor }) => {
  const profile = useGetProfile().data?.data;

  const { mutateAsync, isPending } = useUpdateProfile();
  const { profileDetailsSchema } = useFormSchema();

  const bioSchema = profileDetailsSchema.pick({ bio: true });
  const detailsForm = useFormValidate({
    schema: bioSchema,
    values: { bio: profile?.bio || '' },
  });

  const submitDetails = async ({ bio }: z.infer<typeof bioSchema>) => {
    const res = await mutateAsync({ bio });

    if (!res.success) return;

    setActiveEditor(null);
  };

  return (
    <SettingsDialog
      open={open}
      onOpenChange={open => !open && setActiveEditor(null)}
      title='About / Bio'
      description='Tell people a little about yourself.'
    >
      <form
        onSubmit={detailsForm.handleSubmit(submitDetails)}
        onKeyDown={detailsForm.onFormKeyDown}
        className='space-y-4'
        noValidate
      >
        <FormField htmlFor='bio' label='About / Bio' error={detailsForm.errors('bio')}>
          <Textarea
            id='bio'
            maxLength={500}
            rows={5}
            className='resize-y'
            aria-invalid={Boolean(detailsForm.errors('bio'))}
            {...detailsForm.register('bio')}
          />
        </FormField>
        <DialogActions submitLabel={isPending ? 'Saving bio...' : 'Save bio'} submitLoading={isPending} />
      </form>
    </SettingsDialog>
  );
};

export default ChangeBio;
