'use client';

import { useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { changePasswordAction } from '@/lib/actions/security';

type ChangePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const ChangePasswordDialog = ({ open, onClose }: ChangePasswordDialogProps) => {
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await changePasswordAction(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      onClose();
      toast.success(result?.success ?? 'Password updated.');
    });
  };

  return (
    <SettingsDialog
      open={open}
      onOpenChange={nextOpen => !nextOpen && onClose()}
      title='Change Password'
      description='Use at least six characters for your new password.'
    >
      <form onSubmit={submit} className='space-y-4'>
        <FormField name='currentPassword' label='Current password' type='password' />
        <FormField name='newPassword' label='New password' type='password' minLength={6} required />
        <FormField name='confirmPassword' label='Confirm new password' type='password' minLength={6} required />

        <DialogActions submitLabel='Save password' submitLoading={pending} />
      </form>
    </SettingsDialog>
  );
};
