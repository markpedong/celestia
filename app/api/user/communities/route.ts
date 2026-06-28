import { getCurrentUserID } from '@/lib/auth';
import { listJoinedCommunities } from '@/lib/db/community.queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('Unauthorized.', 401);

  return generateSuccessResponse(await listJoinedCommunities(userID));
};
