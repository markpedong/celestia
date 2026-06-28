import { prisma } from '@/lib/prisma';
import type { ChatConversation, ChatMessage, ChatMessagesPage } from '@/lib/types';

const MESSAGE_LIMIT = 50;
const MESSAGE_MAX_LENGTH = 2000;

const serializeMessage = (message: {
  id: string;
  conversationID: string;
  authorID: string;
  body: string;
  createdAt: Date;
  deletedAt: Date | null;
  author: ChatMessage['author'];
}): ChatMessage => ({
  id: message.id,
  conversationID: message.conversationID,
  authorID: message.authorID,
  body: message.deletedAt ? 'Message deleted' : message.body,
  createdAt: message.createdAt.toISOString(),
  deletedAt: message.deletedAt?.toISOString() ?? null,
  author: message.author,
});

const labelConversation = (
  conversation: {
    type: string;
    community: { label: string } | null;
    participants: { user: { id: string; displayName: string | null; userName: string } }[];
  },
  userID: string,
) => {
  if (conversation.type === 'community') return conversation.community?.label ?? 'Community chat';
  const other = conversation.participants.find(participant => participant.user.id !== userID)?.user;
  return other?.displayName ?? other?.userName ?? 'Direct message';
};

const serializeConversation = (
  conversation: {
    id: string;
    type: string;
    communitySlug: string | null;
    directKey: string | null;
    createdAt: Date;
    updatedAt: Date;
    community: ChatConversation['community'];
    participants: { lastReadAt: Date | null; user: ChatMessage['author'] }[];
    messages: Parameters<typeof serializeMessage>[0][];
    _count?: { messages: number };
  },
  userID: string,
): ChatConversation => ({
  id: conversation.id,
  type: conversation.type === 'direct' ? 'direct' : 'community',
  communitySlug: conversation.communitySlug,
  directKey: conversation.directKey,
  label: labelConversation(conversation, userID),
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
  community: conversation.community,
  participants: conversation.participants.map(participant => ({
    user: participant.user,
    lastReadAt: participant.lastReadAt?.toISOString() ?? null,
  })),
  lastMessage: conversation.messages[0] ? serializeMessage(conversation.messages[0]) : null,
  unreadCount: conversation._count?.messages ?? 0,
});

export const ensureCommunityChatMemberships = async (userID: string) => {
  const memberships = await prisma.communityMembers.findMany({
    where: { userID },
    select: { communitySlug: true },
  });

  for (const membership of memberships) {
    const conversation = await prisma.chatConversation.upsert({
      where: { communitySlug: membership.communitySlug },
      create: {
        type: 'community',
        communitySlug: membership.communitySlug,
        participants: { create: { userID } },
      },
      update: {},
      select: { id: true },
    });

    await prisma.chatParticipant.upsert({
      where: { conversationID_userID: { conversationID: conversation.id, userID } },
      create: { conversationID: conversation.id, userID },
      update: {},
    });
  }
};

export const listChatConversations = async (userID: string): Promise<ChatConversation[]> => {
  await ensureCommunityChatMemberships(userID);

  const conversations = await prisma.chatConversation.findMany({
    where: { participants: { some: { userID } } },
    orderBy: { updatedAt: 'desc' },
    include: {
      community: { select: { slug: true, label: true, hashColor: true, avatarUrl: true } },
      participants: {
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { author: true },
      },
    },
  });

  const participantReads = await prisma.chatParticipant.findMany({
    where: { userID, conversationID: { in: conversations.map(conversation => conversation.id) } },
    select: { conversationID: true, lastReadAt: true },
  });
  const readByConversationID = new Map(participantReads.map(row => [row.conversationID, row.lastReadAt]));

  return Promise.all(conversations.map(async conversation => {
    const unreadCount = await prisma.chatMessage.count({
      where: {
        conversationID: conversation.id,
        deletedAt: null,
        authorID: { not: userID },
        createdAt: { gt: readByConversationID.get(conversation.id) ?? new Date(0) },
      },
    });

    return serializeConversation({ ...conversation, _count: { messages: unreadCount } }, userID);
  }));
};

export const createOrGetDirectConversation = async (userID: string, targetUserID: string): Promise<ChatConversation> => {
  if (userID === targetUserID) throw new Error('Choose another user to message.');

  const target = await prisma.users.findUnique({ where: { id: targetUserID }, select: { id: true } });
  if (!target) throw new Error('User not found.');

  const sharedCommunity = await prisma.communityMembers.findFirst({
    where: {
      userID,
      community: { memberships: { some: { userID: targetUserID } } },
    },
    select: { communitySlug: true },
  });
  if (!sharedCommunity) throw new Error('You can only message mutual community members.');

  const directKey = [userID, targetUserID].sort().join(':');
  const conversation = await prisma.chatConversation.upsert({
    where: { directKey },
    create: {
      type: 'direct',
      directKey,
      participants: {
        createMany: {
          data: [{ userID }, { userID: targetUserID }],
          skipDuplicates: true,
        },
      },
    },
    update: {},
    include: {
      community: { select: { slug: true, label: true, hashColor: true, avatarUrl: true } },
      participants: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      messages: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1, include: { author: true } },
    },
  });

  await Promise.all([userID, targetUserID].map(participantID =>
    prisma.chatParticipant.upsert({
      where: { conversationID_userID: { conversationID: conversation.id, userID: participantID } },
      create: { conversationID: conversation.id, userID: participantID },
      update: {},
    }),
  ));

  return serializeConversation({ ...conversation, _count: { messages: 0 } }, userID);
};

export const assertChatParticipant = async (conversationID: string, userID: string) => {
  const participant = await prisma.chatParticipant.findUnique({
    where: { conversationID_userID: { conversationID, userID } },
    select: { conversationID: true },
  });
  if (!participant) throw new Error('Conversation not found.');
};

export const listChatMessages = async (
  conversationID: string,
  userID: string,
  cursor?: string,
): Promise<ChatMessagesPage> => {
  await assertChatParticipant(conversationID, userID);

  const cursorDate = cursor ? new Date(cursor) : null;
  if (cursor && Number.isNaN(cursorDate?.getTime())) throw new Error('Invalid message cursor.');

  const rows = await prisma.chatMessage.findMany({
    where: {
      conversationID,
      deletedAt: null,
      ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: MESSAGE_LIMIT + 1,
    include: { author: true },
  });

  const page = rows.slice(0, MESSAGE_LIMIT);
  return {
    messages: page.reverse().map(serializeMessage),
    nextCursor: rows.length > MESSAGE_LIMIT ? page.at(-1)?.createdAt.toISOString() ?? null : null,
  };
};

export const createChatMessage = async (
  conversationID: string,
  authorID: string,
  body: string,
): Promise<ChatMessage> => {
  await assertChatParticipant(conversationID, authorID);

  const trimmed = body.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');
  if (trimmed.length > MESSAGE_MAX_LENGTH) throw new Error(`Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`);

  const message = await prisma.chatMessage.create({
    data: { conversationID, authorID, body: trimmed },
    include: { author: true },
  });

  await prisma.chatParticipant.update({
    where: { conversationID_userID: { conversationID, userID: authorID } },
    data: { lastReadAt: message.createdAt },
  });

  return serializeMessage(message);
};

export const markChatRead = async (conversationID: string, userID: string) => {
  await assertChatParticipant(conversationID, userID);

  await prisma.chatParticipant.update({
    where: { conversationID_userID: { conversationID, userID } },
    data: { lastReadAt: new Date() },
  });
};
