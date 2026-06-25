import { USER_FIELDS } from '@/constants';
import { getCurrentUserID } from '@/lib/auth';
import { getUserByUserName } from '@/lib/db/queries';
import { prisma } from '@/lib/prisma';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import pick from 'lodash/pick';

export const GET = async (request: Request,) => {
  const { searchParams } = new URL(request.url);
  const userName = searchParams.get('username') ?? '';

  if (!userName) {
    return generateErrorResponse('Username is required');
  }

  try {
    const profile = await getUserByUserName(userName);
    if (!profile) {
      return generateErrorResponse('User not found', 404);
    }

    return generateSuccessResponse(profile);
  } catch (error: any) {
    return generateErrorResponse(error.message, 404);
  }

  // return generateSuccessResponse(profile);
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('Unauthorized.', 401);

  const body = await request.json();
  const data = pick(body, USER_FIELDS);

  if (!Object.keys(data).length) {
    return generateErrorResponse('No fields to update.', 400);
  }

  await prisma.users.update({ where: { id: userID }, data, });

  return generateSuccessResponse(null, 200, 'Profile updated successfully.');
}