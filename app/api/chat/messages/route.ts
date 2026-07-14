import { getCurrentUserID } from '@/lib/auth';
import { createChatMessage, listChatMessages } from '@/lib/db/chat.queries';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const GET = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to view messages.', 401);

  const { searchParams } = new URL(request.url);
  const conversationID = searchParams.get('conversationID');
  const cursor = searchParams.get('cursor') ?? undefined;
  if (!conversationID) return generateErrorResponse('Conversation is required.');

  try {
    return generateSuccessResponse(await listChatMessages(conversationID, userID, cursor));
  } catch (error) {
    return generateErrorResponse(error instanceof Error ? error.message : 'Unable to load messages.', 404);
  }
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to send messages.', 401);
  if (!await checkRateLimit(`chat-message:${userID}`, 90, 60)) {
    return generateErrorResponse('You are sending messages too quickly. Try again in a moment.', 429);
  }

  const { conversationID, body } = await request.json();
  if (typeof conversationID !== 'string' || typeof body !== 'string') {
    return generateErrorResponse('Invalid message.');
  }

  try {
    return generateSuccessResponse(await createChatMessage(conversationID, userID, body), 201, 'Message sent.');
  } catch (error) {
    return generateErrorResponse(error instanceof Error ? error.message : 'Unable to send message.', 400);
  }
};
