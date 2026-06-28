import { HTTP_MESSAGE } from "@/constants/enums";
import { getCommunityStatsData } from "@/lib/db/community.queries";
import { generateErrorResponse, generateSuccessResponse } from "@/services/request";

const respondWithStats = async (slug: unknown) => {
  if (!slug) return generateErrorResponse(HTTP_MESSAGE.NOT_FOUND, 404);
  return generateSuccessResponse(await getCommunityStatsData(String(slug)));
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  return respondWithStats(searchParams.get('slug'));
};

export const POST = async (request: Request) => {
  const { slug } = await request.json();
  return respondWithStats(slug);
};
