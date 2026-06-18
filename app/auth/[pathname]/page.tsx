import { AuthView } from '@neondatabase/auth/react';
import AuthMethods from '@/components/auth/auth-methods';
import { Zap } from 'lucide-react';
import Link from 'next/link';

const AuthPage = async ({ params }: { params: Promise<{ pathname: string }> }) => {
  const { pathname } = await params;

  return (
    <div className='flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8'>
      <Link href='/' className='mb-6 flex flex-col items-center text-center'>
        <span className='celestia-brand-mark mb-3 size-11 rounded-xl'>
          <Zap className='size-5 fill-current' />
        </span>
        <span className='text-xl font-bold text-foreground'>{pathname === 'sign-up' ? 'Join Celestia' : 'Welcome back'}</span>
        <span className='mt-1 text-sm text-muted-foreground'>
          {pathname === 'sign-up' ? 'Create your account to participate' : 'Sign in to continue the conversation'}
        </span>
      </Link>
      <div className='celestia-card w-full max-w-md p-6 shadow-[0_0_60px_rgba(139,92,246,0.12)]'>
        <AuthMethods />
        <div className='my-6 flex items-center gap-3'>
          <div className='h-px flex-1 bg-border' />
          <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>or</span>
          <div className='h-px flex-1 bg-border' />
        </div>
        <AuthView pathname={pathname} redirectTo='/' />
      </div>
    </div>
  );
};

export default AuthPage;
