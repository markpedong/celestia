import { PasswordRecoveryForm } from '@/components/auth/password-recovery-form';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  return (
    <main className='flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8'>
      <Link href='/' className='mb-6 flex flex-col items-center text-center'>
        <span className='celestia-brand-mark mb-3 size-11 rounded'><Zap className='size-5 fill-current' /></span>
        <span className='text-xl font-bold text-foreground'>Choose a new password</span>
        <span className='mt-1 text-sm text-muted-foreground'>Use a password you do not use elsewhere.</span>
      </Link>
      <div className='celestia-card w-full max-w-md p-6 shadow-2xl shadow-primary/10'>
        <PasswordRecoveryForm mode='update' />
      </div>
    </main>
  );
}
