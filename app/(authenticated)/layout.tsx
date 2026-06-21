import type { MainLayoutProps } from '@/lib/types';
import PublicLayout from '@/app/(public)/layout';

const AuthenticatedLayout = ({ children }: MainLayoutProps) => <PublicLayout>{children}</PublicLayout>;

export default AuthenticatedLayout;
