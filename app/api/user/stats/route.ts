import { batchUserStatsForIDs, getUserStats } from '@/lib/db/user.queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const ids = searchParams.get('ids');

  if (ids) {
    const userIDs = ids.split(',').map(value => value.trim()).filter(Boolean);
    return generateSuccessResponse([...(await batchUserStatsForIDs(userIDs)).entries()]);
  }

  if (!id) return generateErrorResponse('User ID is required.');
  return generateSuccessResponse(await getUserStats(id));
};
