import { apiResponse } from '@/lib/api-response';
import { getUserByUsername } from '@/lib/db/queries';

export const POST = async (request: Request) => {
  const { username } = await request.json();

  if (!username) {
    return apiResponse.error('Username is required');
  }

  const profile = await getUserByUsername(username);

  if (!profile) {
    return apiResponse.error('User not found', 404);
  }

  return apiResponse.success(profile);
};