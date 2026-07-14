import { getCurrentUserID } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const GET = async () => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to view notifications.', 401);
  const rows = await prisma.notification.findMany({
    where: { userID },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return generateSuccessResponse(rows.map(row => ({
    ...row,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  })));
};

export const PATCH = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to update notifications.', 401);
  const { notificationID, all = false } = await request.json();
  if (!all && typeof notificationID !== 'string') return generateErrorResponse('Notification is required.');

  await prisma.notification.updateMany({
    where: { userID, readAt: null, ...(!all ? { id: notificationID } : {}) },
    data: { readAt: new Date() },
  });
  return generateSuccessResponse({ ok: true }, 200, all ? 'All notifications marked read.' : 'Notification marked read.');
};
