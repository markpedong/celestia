'use client';

import { useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { verifyAccountPasswordAction } from '@/lib/actions/security';

type SensitiveSetting = 'email' | 'phone' | 'gender' | 'location' | 'passkey' | 'mfa' | 'backupCodes';

type VerifiedResult = {
  success: string;
  setting: SensitiveSetting;
  token: string;
};

type VerifyPasswordDialogProps = {
  setting: SensitiveSetting | null;
  onCloseAction: () => void;
  onVerifiedAction: (result: VerifiedResult) => void | Promise<void>;
};

export const VerifyPasswordDialog = ({ setting, onCloseAction, onVerifiedAction }: VerifyPasswordDialogProps) => {
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!setting) return;

    const formData = new FormData(event.currentTarget);
    formData.set('setting', setting);

    startTransition(async () => {
      const result = await verifyAccountPasswordAction(formData);

      if (result?.error || !result?.setting || !result.token) {
        toast.error(result?.error ?? 'Unable to verify your password.');
        return;
      }

      await onVerifiedAction(result as VerifiedResult);
    });
  };

  return (
    <SettingsDialog
      open={setting !== null}
      onOpenChange={open => !open && onCloseAction()}
      title='Verify your password'
      description='Enter your password to continue editing this setting.'
    >
      <form onSubmit={submit} className='space-y-4'>
        <FormField name='password' label='Current password' type='password' />

        <DialogActions submitLabel='Verify password' submitLoading={pending} />
      </form>
    </SettingsDialog>
  );
};
