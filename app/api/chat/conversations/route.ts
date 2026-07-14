import { getCurrentUserID } from '@/lib/auth';
import { createOrGetDirectConversation, listChatConversations } from '@/lib/db/chat.queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const GET = async () => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to view chat.', 401);

  return generateSuccessResponse(await listChatConversations(userID));
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to start a chat.', 401);
  if (!await checkRateLimit(`chat-start:${userID}`, 30, 600)) {
    return generateErrorResponse('Conversation limit reached. Try again later.', 429);
  }

  const { targetUserID } = await request.json();
  if (typeof targetUserID !== 'string') return generateErrorResponse('Target user is required.');

  try {
    return generateSuccessResponse(await createOrGetDirectConversation(userID, targetUserID), 201, 'Conversation ready.');
  } catch (error) {
    return generateErrorResponse(error instanceof Error ? error.message : 'Unable to start conversation.', 400);
  }
};
