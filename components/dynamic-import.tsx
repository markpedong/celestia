'use client';

import dynamic from 'next/dynamic';
import Skeleton from 'react-loading-skeleton';

const AccountMenuDynamic = dynamic(() => import('./auth/account-menu'));

const ToasterDynamic = dynamic(() => import('./ui/sonner').then(module => module.Toaster), { ssr: false });

const MobileBottomNavDynamic = dynamic(() => import('./layout/mobile-bottom-nav'), { ssr: false });

const ActiveNowDynamic = dynamic(() => import('./presence/online-users').then(module => module.ActiveNow), {
  ssr: false,
  loading: () => (
    <section className='celestia-card p-4' aria-hidden>
      <Skeleton width={96} height={16} />
      <Skeleton width={128} height={32} />
    </section>
  ),
});

const VerifyPasswordDialogDynamic = dynamic(() =>
  import('./dialogs/verify-password').then(module => module.VerifyPasswordDialog)
);

const SensitiveSettingDialogDynamic = dynamic(() =>
  import('./dialogs/sensitive-setting').then(module => module.SensitiveSettingDialog)
);

const ChangePasswordDialogDynamic = dynamic(() =>
  import('./dialogs/change-password').then(module => module.ChangePasswordDialog)
);

const SetPasswordDialogDynamic = dynamic(() =>
  import('./dialogs/set-password').then(module => module.SetPasswordDialog)
);

const MfaDialogDynamic = dynamic(() => import('./dialogs/mfa-dialog').then(module => module.MfaDialog));

const BackupCodesDialogDynamic = dynamic(() =>
  import('./dialogs/backup-codes').then(module => module.BackupCodesDialog)
);

const DeleteAccountDialogDynamic = dynamic(() =>
  import('./dialogs/delete-account').then(module => module.DeleteAccountDialog)
);

export {
  AccountMenuDynamic,
  ToasterDynamic,
  MobileBottomNavDynamic,
  ActiveNowDynamic,
  VerifyPasswordDialogDynamic,
  SensitiveSettingDialogDynamic,
  ChangePasswordDialogDynamic,
  SetPasswordDialogDynamic,
  MfaDialogDynamic,
  BackupCodesDialogDynamic,
  DeleteAccountDialogDynamic,
};
