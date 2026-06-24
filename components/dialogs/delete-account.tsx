'use client';

import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';

type DeleteAccountDialogProps = {
  open: boolean;
  onCloseAction: () => void;
  action: (values: { confirmation: string }) => void;
  pending: boolean;
};

export const DeleteAccountDialog = ({ open, onCloseAction, action, pending }: DeleteAccountDialogProps) => {
  const { deleteAccountSchema } = useFormSchema();
  const { register, handleSubmit, onFormKeyDown, formState: { errors } } = useFormValidate({
    schema: deleteAccountSchema,
    defaultValues: { confirmation: '' },
  });
  const onSubmit = ({ confirmation }: { confirmation: string }) => action({ confirmation });

  return <SettingsDialog
    open={open}
    onOpenChange={nextOpen => !nextOpen && onCloseAction()}
    title='Delete account?'
    description='This permanently deletes your account, profile, posts, comments, votes, memberships, and backup codes.'
  >
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onFormKeyDown} className='space-y-4' noValidate>
      <FormField label='Type DELETE to confirm' error={errors.confirmation?.message} {...register('confirmation')} />

      <DialogActions submitLabel='Delete account' submitVariant='destructive' submitLoading={pending} />
    </form>
  </SettingsDialog>;
};
