'use client';

import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { deleteAccountSchema } from '@/lib/form-schemas';
import { useZodForm } from '@/hooks/use-zod-form';

type DeleteAccountDialogProps = {
  open: boolean;
  onCloseAction: () => void;
  action: (formData: FormData) => void;
  pending: boolean;
};

export const DeleteAccountDialog = ({ open, onCloseAction, action, pending }: DeleteAccountDialogProps) => {
  const { register, handleSubmit, onFormKeyDown, formState: { errors } } = useZodForm(deleteAccountSchema, { confirmation: '' });
  const submit = handleSubmit(({ confirmation }) => {
    const formData = new FormData();
    formData.set('confirmation', confirmation);
    action(formData);
  });

  return <SettingsDialog
    open={open}
    onOpenChange={nextOpen => !nextOpen && onCloseAction()}
    title='Delete account?'
    description='This permanently deletes your account, profile, posts, comments, votes, memberships, and backup codes.'
  >
    <form onSubmit={submit} onKeyDown={onFormKeyDown} className='space-y-4' noValidate>
      <FormField label='Type DELETE to confirm' error={errors.confirmation?.message} {...register('confirmation')} />

      <DialogActions submitLabel='Delete account' submitVariant='destructive' submitLoading={pending} />
    </form>
  </SettingsDialog>;
};
