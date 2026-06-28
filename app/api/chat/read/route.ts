import { getCurrentUserID } from '@/lib/auth';
import { markChatRead } from '@/lib/db/chat.queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to update chat.', 401);

  const { conversationID } = await request.json();
  if (typeof conversationID !== 'string') return generateErrorResponse('Conversation is required.');

  try {
    await markChatRead(conversationID, userID);
    return generateSuccessResponse({ ok: true }, 200, 'Conversation marked read.');
  } catch (error) {
    return generateErrorResponse(error instanceof Error ? error.message : 'Unable to update chat.', 404);
  }
};
