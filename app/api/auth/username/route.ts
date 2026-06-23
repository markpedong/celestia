import { prisma } from '@/lib/prisma';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const POST = async (request: Request) => {
  const { username } = await request.json();
  if (!username) return generateErrorResponse('Invalid credentials', 404);

  const profile = await prisma.userProfile.findUnique({
    where: { username },
    select: { email: true },
  });

  if (!profile?.email) return generateErrorResponse('Invalid credentials', 404);

  return generateSuccessResponse({ email: profile.email });
};
