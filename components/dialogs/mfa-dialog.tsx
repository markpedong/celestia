'use client';

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
      <div className='space-y-5'>
        <div className='flex justify-center'>
          <div className='rounded-lg border border-border bg-background p-3 shadow-sm'>
            <img
              src={enrollment.qr.trimEnd()}
              alt='Authenticator setup QR code'
              width={192}
              height={192}
              className='size-48'
            />
          </div>
        </div>

        <div className='rounded-md border border-border bg-muted/40 p-3'>
          <p className='text-xs font-medium text-foreground'>Manual setup key</p>
          <p className='mt-1 break-all font-mono text-xs text-muted-foreground'>{enrollment.secret}</p>
        </div>

        <div className='space-y-2'>
          <label htmlFor='mfa-code' className='text-sm font-medium'>Verification code</label>
          <Input
            id='mfa-code'
            value={code}
            onChange={event => onCodeChangeAction(event.target.value)}
            inputMode='numeric'
            autoComplete='one-time-code'
            placeholder='6-digit code'
            className='text-center font-mono tracking-[0.2em]'
          />
        </div>

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
