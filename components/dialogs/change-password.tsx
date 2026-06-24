'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { changePasswordAction } from '@/lib/actions/security';
import z from 'zod';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';

type ChangePasswordDialogProps = {
  open: boolean;
  onCloseAction: () => void;
};

export const ChangePasswordDialog = ({ open, onCloseAction }: ChangePasswordDialogProps) => {
  const [pending, startTransition] = useTransition();
  const { changePasswordSchema, changePasswordInital } = useFormSchema();
  const { register, handleSubmit, onFormKeyDown } = useFormValidate({
    schema: changePasswordSchema,
    defaultValues: changePasswordInital,
  });

  const submit = handleSubmit(({ currentPassword, newPassword, confirmPassword }) => {
    const formData = new FormData();
    formData.set('currentPassword', currentPassword);
    formData.set('newPassword', newPassword);
    formData.set('confirmPassword', confirmPassword);

    startTransition(async () => {
      const result = await changePasswordAction(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      onCloseAction();
      toast.success(result?.success ?? 'Password updated.');
    });
  });

  const onSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    startTransition(async () => {
      const result = await changePasswordAction(values);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      onCloseAction();
      toast.success(result?.success ?? 'Password updated.');
    });
  };

  return (
    <SettingsDialog
      open={open}
      onOpenChange={nextOpen => !nextOpen && onCloseAction()}
      title='Change Password'
      description='Use at least six characters for your new password.'
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onFormKeyDown} className='space-y-4' noValidate>
        <FormField
          label='Current password'
          type='password'
          error={errors.currentPassword?.message}
          {...register('currentPassword', { required: 'Enter your current password.' })}
        />
        <FormField
          label='New password'
          type='password'
          error={errors.newPassword?.message}
          {...register('newPassword', {
            required: 'Enter a new password.',
            minLength: { value: 6, message: 'Use at least 6 characters.' },
          })}
        />
        <FormField
          label='Confirm new password'
          type='password'
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <DialogActions submitLabel='Save password' submitLoading={pending} />
      </form>
    </SettingsDialog>
  );
};
