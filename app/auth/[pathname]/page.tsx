import { AuthView } from '@neondatabase/auth/react';

const AuthPage = async ({ params }: { params: Promise<{ pathname: string }> }) => {
  const { pathname } = await params;

  return (
    <div className='flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8'>
      <div className='w-full max-w-md'>
        <AuthView pathname={pathname} />
      </div>
    </div>
  );
};

export default AuthPage;
