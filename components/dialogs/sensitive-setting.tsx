'use client';

import { useEffect, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { updateSensitiveAccountAction } from '@/lib/actions/security';
import useFormValidate from '@/hooks/useFormValidate';
import useFormSchema from '@/hooks/useFormSchema';

type EditableSetting = 'email' | 'phone' | 'gender' | 'location';

type SensitiveSettingDialogProps = {
  dialog: { type: 'edit'; setting: EditableSetting; token: string } | null;
  user: User | null;
  onCloseAction: () => void;
};

export const SensitiveSettingDialog = ({ dialog, user, onCloseAction }: SensitiveSettingDialogProps) => {
  const [pending, startTransition] = useTransition();
  const { sensitiveSettingSchema } = useFormSchema();
  const { register, handleSubmit, reset, setError, onFormKeyDown, formState: { errors } } = useFormValidate({
    schema: sensitiveSettingSchema,
    defaultValues: { value: '' },
  });

  const config = dialog
    ? {
        email: {
          title: 'Change email',
          description: 'We’ll send a confirmation email to your new address.',
          label: 'Email address',
          name: 'value',
          type: 'email',
          defaultValue: user?.email ?? '',
          submitLabel: 'Save email',
          required: true,
        },
        phone: {
          title: 'Phone Number',
          description: 'Keep your phone number current for account recovery.',
          label: 'Phone number',
          name: 'phone',
          type: 'tel',
          placeholder: '+63 900 000 0000',
          defaultValue: user?.phone ?? '',
          submitLabel: 'Save phone',
          required: false,
        },
        location: {
          title: 'Location',
          description: 'Update this account preference.',
          label: 'Location',
          name: 'value',
          type: 'text',
          defaultValue: typeof user?.user_metadata.location === 'string' ? user.user_metadata.location : '',
          submitLabel: 'Save location',
          required: false,
        },
        gender: {
          title: 'Gender',
          description: 'Update this account preference.',
          label: 'Gender',
          name: 'value',
          type: 'text',
          defaultValue: typeof user?.user_metadata.gender === 'string' ? user.user_metadata.gender : '',
          submitLabel: 'Save gender',
          required: false,
        },
      }[dialog.setting]
    : null;

  useEffect(() => {
    reset({ value: config?.defaultValue ?? '' });
  }, [config?.defaultValue, reset]);

  const onSubmit = async ({ value }: { value: string }) => {
    if (!dialog) return;

    const nextValue = value.trim();

    if (dialog.setting === 'email') {
      const currentEmail = user?.email?.trim().toLowerCase();
      const nextEmail = nextValue.toLowerCase();

      if (!/^\S+@\S+\.\S+$/.test(nextValue)) {
        setError('value', { message: 'Enter a valid email address.' });
        return;
      }

      if (currentEmail && nextEmail === currentEmail) {
        setError('value', { message: 'Enter a different email address.' });
        return;
      }
    }

    startTransition(async () => {
      const result = await updateSensitiveAccountAction({ value: nextValue, setting: dialog.setting, token: dialog.token });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      onCloseAction();
      toast.success(result?.success ?? 'Account details updated.');
    });
  };

  if (!dialog || !config) return null;

  return (
    <SettingsDialog
      open
      onOpenChange={open => !open && onCloseAction()}
      title={config.title}
      description={config.description}
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onFormKeyDown} className='space-y-4' noValidate>
        <FormField
          label={config.label}
          type={config.type}
          placeholder={'placeholder' in config ? config.placeholder : undefined}
          defaultValue={config.defaultValue}
          error={errors.value?.message}
          {...register('value', { required: config.required ? `${config.label} is required.` : false })}
        />

        <DialogActions submitLabel={config.submitLabel} submitLoading={pending} />
      </form>
    </SettingsDialog>
  );
};
