'use client';

import { useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { setPasswordAction } from '@/lib/actions/security';

type SetPasswordDialogProps = {
  open: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
};

export const SetPasswordDialog = ({ open, onCloseAction, onSuccessAction }: SetPasswordDialogProps) => {
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await setPasswordAction(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      onSuccessAction();
      onCloseAction();
      toast.success(result?.success ?? 'Password set.');
    });
  };

  return (
    <SettingsDialog
      open={open}
      onOpenChange={nextOpen => !nextOpen && onCloseAction()}
      title='Set Password'
      description='Create a password for signing in without Google.'
    >
      <form onSubmit={submit} className='space-y-4'>
        <FormField name='newPassword' label='New password' type='password' minLength={6} required />
        <FormField name='confirmPassword' label='Confirm new password' type='password' minLength={6} required />

        <DialogActions submitLabel='Set password' submitLoading={pending} />
      </form>
    </SettingsDialog>
  );
};
