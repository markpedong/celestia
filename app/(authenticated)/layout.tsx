import type { MainLayoutProps } from '@/lib/types';
import PublicLayout from '@/app/(public)/layout';

export const dynamic = 'force-dynamic';

const AuthenticatedLayout = ({ children }: MainLayoutProps) => <PublicLayout>{children}</PublicLayout>;

export default AuthenticatedLayout;
