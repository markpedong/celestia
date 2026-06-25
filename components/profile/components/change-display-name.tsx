import DialogActions from '@/components/ui/dialog-actions';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import useFormSchema from '@/hooks/useFormSchema';
import useFormValidate from '@/hooks/useFormValidate';
import { useGetProfile, useUpdateProfile } from '@/hooks/useQueries';
import { MediaKind } from '@/lib/types';
import { Dispatch, FC, SetStateAction } from 'react';
import z from 'zod';

type Props = {
  open: boolean;
  setActiveEditor: Dispatch<SetStateAction<MediaKind | 'displayName' | 'bio' | null>>;
};

const ChangeDisplayName: FC<Props> = ({ open, setActiveEditor }) => {
  const profile = useGetProfile().data?.data;

  console.log('@@@', profile?.displayName);

  const { mutateAsync, isPending } = useUpdateProfile();
  const { profileDetailsSchema } = useFormSchema();

  const displayNameSchema = profileDetailsSchema.pick({ displayName: true });
  const detailsForm = useFormValidate({
    schema: displayNameSchema,
    values: { displayName: profile?.displayName || '' },
  });

  const submitDetails = async ({ displayName }: z.infer<typeof displayNameSchema>) => {
    const res = await mutateAsync({ displayName });

    if (!res.success) return;

    setActiveEditor(null);
  };

  return (
    <SettingsDialog
      open={open}
      onOpenChange={open => !open && setActiveEditor(null)}
      title='Display Name'
      description='This is the name shown across Celestia.'
    >
      <form
        onSubmit={detailsForm.handleSubmit(submitDetails)}
        onKeyDown={detailsForm.onFormKeyDown}
        className='space-y-4'
        noValidate
      >
        <FormField
          label='Display Name'
          labelClassName='text-card-foreground'
          placeholder='johndoe'
          error={detailsForm.formState.errors.displayName?.message}
          maxLength={20}
          {...detailsForm.register('displayName')}
        />
        <DialogActions submitLabel={isPending ? 'Saving...' : 'Save'} submitLoading={isPending} />
      </form>
    </SettingsDialog>
  );
};

export default ChangeDisplayName;
