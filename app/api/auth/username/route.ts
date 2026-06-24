import { prisma } from '@/lib/prisma';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const POST = async (request: Request) => {
  const { userName } = await request.json();
  if (!userName) return generateErrorResponse('Invalid credentials', 404);

  const profile = await prisma.users.findUnique({
    where: { userName },
    select: { email: true },
  });

  if (!profile?.email) return generateErrorResponse('Invalid credentials', 404);

  return generateSuccessResponse({ email: profile.email });
};
