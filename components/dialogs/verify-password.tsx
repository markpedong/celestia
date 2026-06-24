'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { verifyAccountPasswordAction } from '@/lib/actions/security';
import { passwordSchema } from '@/lib/form-schemas';
import { useZodForm } from '@/hooks/use-zod-form';

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
  const { register, handleSubmit, onFormKeyDown, formState: { errors } } = useZodForm(passwordSchema, { password: '' });

  const submit = handleSubmit(({ password }) => {
    if (!setting) return;
    const formData = new FormData();
    formData.set('password', password);
    formData.set('setting', setting);

    startTransition(async () => {
      const result = await verifyAccountPasswordAction(formData);

      if (result?.error || !result?.setting || !result.token) {
        toast.error(result?.error ?? 'Unable to verify your password.');
        return;
      }

      await onVerifiedAction(result as VerifiedResult);
    });
  });

  return (
    <SettingsDialog
      open={setting !== null}
      onOpenChange={open => !open && onCloseAction()}
      title='Verify your password'
      description='Enter your password to continue editing this setting.'
    >
      <form onSubmit={submit} onKeyDown={onFormKeyDown} className='space-y-4' noValidate>
        <FormField label='Current password' type='password' error={errors.password?.message} {...register('password', { required: 'Enter your password.' })} />

        <DialogActions submitLabel='Verify password' submitLoading={pending} />
      </form>
    </SettingsDialog>
  );
};
