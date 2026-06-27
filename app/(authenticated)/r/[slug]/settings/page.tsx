import type { CommunitySettingsPageProps } from '@/lib/types';
import { redirect } from 'next/navigation';

const LegacyCommunitySettingsPage = async ({ params }: CommunitySettingsPageProps) => {
  const { slug } = await params;
  redirect(`/settings/communities/${encodeURIComponent(decodeURIComponent(slug).trim().toLowerCase())}`);
};

export default LegacyCommunitySettingsPage;
