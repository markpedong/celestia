import { getAuthorByID, getUserByUserName, listUserNames } from '@/lib/db/user.queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const id = searchParams.get('id');
  const userName = searchParams.get('username') ?? '';

  if (mode === 'usernames') {
    return generateSuccessResponse(await listUserNames());
  }

  if (id) {
    const profile = await getAuthorByID(id);
    return profile ? generateSuccessResponse(profile) : generateErrorResponse('User not found', 404);
  }

  if (!userName) {
    return generateErrorResponse('Username is required');
  }

  try {
    const profile = await getUserByUserName(userName);
    if (!profile) {
      return generateErrorResponse('User not found', 404);
    }

    return generateSuccessResponse(profile);
  } catch (error: unknown) {
    return generateErrorResponse(error instanceof Error ? error.message : 'User not found', 404);
  }
};
