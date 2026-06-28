import { listCommunityMembers } from '@/lib/db/community.queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? '';
  if (!slug) return generateErrorResponse('Community slug is required.');

  return generateSuccessResponse(await listCommunityMembers(slug.trim().toLowerCase()));
};
