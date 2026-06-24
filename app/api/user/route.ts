import { getUserByUserName } from '@/lib/db/queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const POST = async (request: Request) => {
  const { userName } = await request.json();

  if (!userName) {
    return generateErrorResponse('Username is required');
  }

  const profile = await getUserByUserName(userName);

  if (!profile) {
    return generateErrorResponse('User not found', 404);
  }

  return generateSuccessResponse(profile);
};
