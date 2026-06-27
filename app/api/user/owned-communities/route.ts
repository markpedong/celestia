import { getCurrentUserID } from '@/lib/auth';
import { listOwnedCommunities } from '@/lib/db/queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const profileID = searchParams.get('profileID') ?? '';
  const userID = await getCurrentUserID();

  if (!userID) return generateErrorResponse('Unauthorized.', 401);
  if (!profileID) return generateErrorResponse('Profile ID is required.');
  if (profileID !== userID) return generateErrorResponse('Only the profile owner can view managed communities.', 403);

  const communities = await listOwnedCommunities(userID);

  return generateSuccessResponse(communities);
};
