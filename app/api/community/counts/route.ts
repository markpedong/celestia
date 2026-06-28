import { tagsPostCounts } from '@/lib/db/community.queries';
import { generateSuccessResponse } from '@/services/request';

export const GET = async () => {
  return generateSuccessResponse(await tagsPostCounts());
};
