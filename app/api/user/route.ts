import { getUserByUsername } from '@/lib/db/queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const POST = async (request: Request) => {
  const { username } = await request.json();

  if (!username) {
    return generateErrorResponse('Username is required');
  }

  const profile = await getUserByUsername(username);

  if (!profile) {
    return generateErrorResponse('User not found', 404);
  }

  return generateSuccessResponse(profile);
};