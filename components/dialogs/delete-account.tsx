'use client';

import type { Dispatch, SetStateAction } from 'react';
import FormField from '@/components/ui/form-field';
import SettingsDialog from '@/components/ui/settings-dialog';
import DialogActions from '@/components/ui/dialog-actions';

type DeleteAccountDialogProps = {
  open: boolean;
  onClose: () => void;
  action: Dispatch<SetStateAction<FormData>>;
  pending: boolean;
};

export const DeleteAccountDialog = ({ open, onClose, action, pending }: DeleteAccountDialogProps) => (
  <SettingsDialog
    open={open}
    onOpenChange={nextOpen => !nextOpen && onClose()}
    title='Delete account?'
    description='This permanently deletes your account, profile, posts, comments, votes, memberships, and backup codes.'
  >
    <form action={action} className='space-y-4'>
      <FormField name='confirmation' label='Type DELETE to confirm' />

      <DialogActions submitLabel='Delete account' submitVariant='destructive' submitLoading={pending} />
    </form>
  </SettingsDialog>
);
