'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { setPasswordAction } from '@/lib/actions/security';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';

type SetPasswordDialogProps = {
  open: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void | Promise<void>;
};

export const SetPasswordDialog = ({ open, onCloseAction, onSuccessAction }: SetPasswordDialogProps) => {
  const [pending, startTransition] = useTransition();
  const { setPasswordSchema } = useFormSchema();
  const { register, handleSubmit, onFormKeyDown, formState: { errors } } = useFormValidate({
    schema: setPasswordSchema,
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ newPassword, confirmPassword }: { newPassword: string; confirmPassword: string }) => {
    startTransition(async () => {
      const result = await setPasswordAction({ newPassword, confirmPassword });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      await onSuccessAction();
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
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onFormKeyDown} className='space-y-4' noValidate>
        <FormField label='New password' type='password' error={errors.newPassword?.message} {...register('newPassword', { required: 'Enter a new password.', minLength: { value: 6, message: 'Use at least 6 characters.' } })} />
        <FormField label='Confirm new password' type='password' error={errors.confirmPassword?.message} {...register('confirmPassword')} />

        <DialogActions submitLabel='Set password' submitLoading={pending} />
      </form>
    </SettingsDialog>
  );
};
