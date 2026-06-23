'use client';

import { useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';
import { generateBackupCodesAction } from '@/lib/actions/security';

type BackupCodesDialogProps = {
  open: boolean;
  hasCodes: boolean;
  onClose: () => void;
  onGenerated: (codes: string[] | null) => void;
};

export const BackupCodesDialog = ({ open, hasCodes, onClose, onGenerated }: BackupCodesDialogProps) => {
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await generateBackupCodesAction();

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      onGenerated(result?.codes ?? null);
      toast.success(result?.success ?? 'New backup codes generated.');
    });
  };

  return (
    <SettingsDialog
      open={open}
      onOpenChange={nextOpen => !nextOpen && onClose()}
      title='Backup Codes'
      description='Store these one-time codes somewhere safe. Generating new codes replaces any existing codes.'
    >
      <form onSubmit={submit} className='space-y-4'>
        <p className='text-sm text-muted-foreground'>
          Generate codes for account recovery when your authenticator app is unavailable.
        </p>

        <DialogActions
          submitLabel={hasCodes ? 'Regenerate codes' : 'Generate codes'}
          submitLoading={pending}
          hideCancel
        />
      </form>
    </SettingsDialog>
  );
};
