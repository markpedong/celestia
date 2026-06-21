import AuthMethods from '@/components/auth/auth-methods';
import type { AuthPageProps } from '@/lib/types';
import { Zap } from 'lucide-react';
import Link from 'next/link';

const AuthPage = async ({ params }: AuthPageProps) => {
  const { pathname } = await params;

  return (
    <div className='flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8'>
      <Link href='/' className='mb-6 flex flex-col items-center text-center'>
        <span className='celestia-brand-mark mb-3 size-11 rounded'>
          <Zap className='size-5 fill-current' />
        </span>
        <span className='text-xl font-bold text-foreground'>
          {pathname === 'sign-up' ? 'Join Celestia' : 'Welcome back'}
        </span>
        <span className='mt-1 text-sm text-muted-foreground'>
          {pathname === 'sign-up' ? 'Create your account to participate' : 'Sign in to continue the conversation'}
        </span>
      </Link>
      <div className='celestia-card w-full max-w-md p-6 shadow-2xl shadow-primary/10'>
        <AuthMethods mode={pathname === 'sign-up' ? 'sign-up' : 'sign-in'} />
      </div>
    </div>
  );
};

export const generateStaticParams = () => [{ pathname: 'sign-in' }, { pathname: 'sign-up' }];

export default AuthPage;
