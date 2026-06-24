'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SettingsDialog from '@/components/ui/settings-dialog';

type MfaDialogProps = {
  open: boolean;
  enrollment: { id: string; qr: string; secret: string } | null;
  code: string;
  pending: string | null;
  onCodeChangeAction: (code: string) => void;
  onVerifiedAction: () => void;
  onCancelAction: () => void;
};

export const MfaDialog = ({
  open,
  enrollment,
  code,
  pending,
  onCodeChangeAction,
  onVerifiedAction,
  onCancelAction,
}: MfaDialogProps) => (
  <SettingsDialog
    open={open}
    onOpenChange={nextOpen => !nextOpen && onCancelAction()}
    title='Set up Two-Factor Authentication'
    description='Scan the QR code with your authenticator app, then enter its six-digit code.'
  >
    {enrollment ? (
      <div className='space-y-4'>
        <Image
          src={enrollment.qr}
          alt='Authenticator setup QR code'
          width={176}
          height={176}
          unoptimized
          className='size-44 bg-background p-2'
        />

        <p className='text-xs text-muted-foreground'>
          Can’t scan it? Enter this setup key manually:{' '}
          <span className='break-all font-mono text-foreground'>{enrollment.secret}</span>
        </p>

        <Input
          value={code}
          onChange={event => onCodeChangeAction(event.target.value)}
          inputMode='numeric'
          placeholder='6-digit code'
        />

        <div className='flex justify-end gap-2'>
          <Button type='button' variant='outline' onClick={onCancelAction} isLoading={pending === 'mfa-cancel'}>
            Cancel
          </Button>

          <Button type='button' onClick={onVerifiedAction} isLoading={pending === 'mfa-verify'}>
            Verify and enable
          </Button>
        </div>
      </div>
    ) : (
      <p className='text-sm text-muted-foreground'>Preparing your authenticator setup…</p>
    )}
  </SettingsDialog>
);
