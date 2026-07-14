import { z } from 'zod';
import { getCurrentUserID } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

const reportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user']),
  targetID: z.string().trim().min(1),
  reason: z.string().trim().min(3, 'Describe the problem in at least 3 characters.').max(500),
});

const reportCommunity = async (targetType: 'post' | 'comment' | 'user', targetID: string) => {
  if (targetType === 'post') {
    const post = await prisma.post.findUnique({
      where: { id: targetID },
      select: { postTags: { take: 1, select: { tagSlug: true } } },
    });
    return post ? { exists: true, communitySlug: post.postTags[0]?.tagSlug ?? null } : { exists: false, communitySlug: null };
  }
  if (targetType === 'comment') {
    const comment = await prisma.comment.findUnique({
      where: { id: targetID },
      select: { post: { select: { postTags: { take: 1, select: { tagSlug: true } } } } },
    });
    return comment ? { exists: true, communitySlug: comment.post.postTags[0]?.tagSlug ?? null } : { exists: false, communitySlug: null };
  }
  return { exists: Boolean(await prisma.users.findUnique({ where: { id: targetID }, select: { id: true } })), communitySlug: null };
};

export const POST = async (request: Request) => {
  const reporterID = await getCurrentUserID();
  if (!reporterID) return generateErrorResponse('You must be signed in to report content.', 401);
  if (!await checkRateLimit(`report:${reporterID}`, 20, 3600)) {
    return generateErrorResponse('Report limit reached. Try again later.', 429);
  }

  const parsed = reportSchema.safeParse(await request.json());
  if (!parsed.success) return generateErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid report.');
  const target = await reportCommunity(parsed.data.targetType, parsed.data.targetID);
  if (!target.exists) return generateErrorResponse('Content not found.', 404);

  await prisma.report.upsert({
    where: {
      reporterID_targetType_targetID: {
        reporterID,
        targetType: parsed.data.targetType,
        targetID: parsed.data.targetID,
      },
    },
    create: { reporterID, communitySlug: target.communitySlug, ...parsed.data },
    update: { reason: parsed.data.reason, status: 'pending', reviewedAt: null, reviewedByID: null },
  });
  return generateSuccessResponse({ ok: true }, 201, 'Report submitted.');
};

export const GET = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in.', 401);
  const communitySlug = new URL(request.url).searchParams.get('communitySlug')?.trim().toLowerCase();
  if (!communitySlug) return generateErrorResponse('Community is required.');
  const community = await prisma.community.findUnique({ where: { slug: communitySlug }, select: { createdByID: true } });
  if (!community) return generateErrorResponse('Community not found.', 404);
  if (community.createdByID !== userID) return generateErrorResponse('Only the community owner can view reports.', 403);

  return generateSuccessResponse(await prisma.report.findMany({
    where: { communitySlug },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }));
};

export const PATCH = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in.', 401);
  const { reportID, status } = await request.json();
  if (typeof reportID !== 'string' || (status !== 'approved' && status !== 'dismissed')) {
    return generateErrorResponse('Invalid report update.');
  }
  const report = await prisma.report.findUnique({ where: { id: reportID } });
  if (!report?.communitySlug) return generateErrorResponse('Report not found.', 404);
  const community = await prisma.community.findUnique({ where: { slug: report.communitySlug }, select: { createdByID: true } });
  if (community?.createdByID !== userID) return generateErrorResponse('Only the community owner can review reports.', 403);

  const updated = await prisma.report.update({
    where: { id: reportID },
    data: { status, reviewedAt: new Date(), reviewedByID: userID },
  });
  return generateSuccessResponse(updated, 200, 'Report reviewed.');
};
