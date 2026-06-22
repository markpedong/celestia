import 'next/navigation';
import { WEB_APP_ROUTE } from '@/constants/enums';

declare module 'next/navigation' {
  declare function usePathname(): WEB_APP_ROUTE;
}
