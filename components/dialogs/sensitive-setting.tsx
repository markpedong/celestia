'use client';

import { useTransition, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { updateSensitiveAccountAction } from '@/lib/actions/security';

type EditableSetting = 'email' | 'phone' | 'gender' | 'location';

type SensitiveSettingDialogProps = {
  dialog: { type: 'edit'; setting: EditableSetting; token: string } | null;
  user: User | null;
  onClose: () => void;
};

export const SensitiveSettingDialog = ({ dialog, user, onClose }: SensitiveSettingDialogProps) => {
  const [pending, startTransition] = useTransition();

  const config = dialog
    ? {
        email: {
          title: 'Change email',
          description: 'We’ll send a confirmation email to your new address.',
          label: 'Email address',
          name: 'email',
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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!dialog) return;

    const formData = new FormData(event.currentTarget);
    formData.set('setting', dialog.setting);
    formData.set('verificationToken', dialog.token);

    startTransition(async () => {
      const result = await updateSensitiveAccountAction(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      onClose();
      toast.success(result?.success ?? 'Account details updated.');
    });
  };

  if (!dialog || !config) return null;

  return (
    <SettingsDialog
      open
      onOpenChange={open => !open && onClose()}
      title={config.title}
      description={config.description}
    >
      <form onSubmit={submit} className='space-y-4'>
        <FormField
          name={config.name}
          label={config.label}
          type={config.type}
          placeholder={'placeholder' in config ? config.placeholder : undefined}
          defaultValue={config.defaultValue}
          required={config.required}
        />

        <DialogActions submitLabel={config.submitLabel} submitLoading={pending} />
      </form>
    </SettingsDialog>
  );
};
