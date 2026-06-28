'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Hash, MessageCircle, Send, X } from 'lucide-react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ChatConversation } from '@/lib/types';
import { chatConversationsQueryKey, chatMessagesQueryKey, useChatConversations, useChatMessages, useGetProfile, useMarkChatRead, useSendChatMessage } from '@/hooks/useQueries';
import { OPEN_CHAT_EVENT, PENDING_DIRECT_CONVERSATION_PREFIX, type OpenChatEventDetail } from '@/lib/chat-events';
import styles from './chat-widget.module.scss';

const supabase = createSupabaseBrowserClient();
const EMPTY_CONVERSATIONS: ChatConversation[] = [];

const getConversationIcon = (conversation: ChatConversation, currentUserID: string) => {
  if (conversation.type === 'community') {
    return (
      <span className={styles.conversationIcon}>
        <Hash aria-hidden />
      </span>
    );
  }

  const other = conversation.participants.find(participant => participant.user.id !== currentUserID)?.user;
  return other ? <UserAvatar user={other} size='sm' /> : (
    <span className={styles.conversationIcon}>
      <MessageCircle aria-hidden />
    </span>
  );
};

export const ChatWidget = () => {
  const queryClient = useQueryClient();
  const profile = useGetProfile().data?.data;
  const conversationsQuery = useChatConversations();
  const conversations = conversationsQuery.data?.data ?? EMPTY_CONVERSATIONS;
  const [isOpen, setIsOpen] = useState(false);
  const [activeID, setActiveID] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const selectedID = activeID ?? conversations[0]?.id ?? null;
  const messagesQuery = useChatMessages(selectedID);
  const sendMessage = useSendChatMessage();
  const { mutate: markChatRead } = useMarkChatRead();

  useEffect(() => {
    const openChat = (event: Event) => {
      const detail = (event as CustomEvent<OpenChatEventDetail>).detail;
      if (!detail?.conversationID) return;

      setActiveID(detail.conversationID);
      setIsOpen(true);
    };

    window.addEventListener(OPEN_CHAT_EVENT, openChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openChat);
  }, []);

  useEffect(() => {
    if (!isOpen || !selectedID) return;
    markChatRead(selectedID);
  }, [isOpen, markChatRead, selectedID]);

  useEffect(() => {
    if (!selectedID) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !data.session?.access_token) return;

      supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel(`chat:conversation:${selectedID}`, { config: { private: true } })
        .on('broadcast', { event: 'INSERT' }, () => {
          void queryClient.invalidateQueries({ queryKey: chatMessagesQueryKey(selectedID) });
          void queryClient.invalidateQueries({ queryKey: chatConversationsQueryKey });
        })
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [queryClient, selectedID]);

  const activeConversation = conversations.find(conversation => conversation.id === selectedID) ?? null;
  const isPendingConversation = selectedID?.startsWith(PENDING_DIRECT_CONVERSATION_PREFIX) ?? false;
  const messages = useMemo(
    () => [...(messagesQuery.data?.pages ?? [])]
      .reverse()
      .flatMap(page => page.data?.messages ?? []),
    [messagesQuery.data?.pages],
  );
  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);

  if (!profile) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!selectedID || !body) return;

    setDraft('');
    sendMessage.mutate(
      { conversationID: selectedID, body },
      {
        onSuccess: response => {
          if (!response.success) setDraft(body);
        },
        onError: () => {
          setDraft(body);
        },
      },
    );
  };

  if (!isOpen) {
    return (
      <Button className={styles.launcher} onClick={() => setIsOpen(true)}>
        <MessageCircle />
        <span className={styles.hiddenMobileText}>Chat</span>
        {unreadTotal > 0 ? <span className={styles.unread}>{unreadTotal}</span> : null}
      </Button>
    );
  }

  return (
    <section className={styles.shell} aria-label='Chat'>
      <aside className={styles.rail}>
        <div className={styles.railHeader}>
          <div className={styles.title}>Chat</div>
          <Button variant='ghost' size='icon-sm' aria-label='Close chat' onClick={() => setIsOpen(false)}>
            <X />
          </Button>
        </div>

        <div className={styles.conversationList}>
          {conversations.map(conversation => (
            <button
              key={conversation.id}
              type='button'
              className={classNames(styles.conversationButton, {
                [styles.conversationButtonActive]: conversation.id === selectedID,
              })}
              onClick={() => setActiveID(conversation.id)}
            >
              {getConversationIcon(conversation, profile.id)}
              <span className={styles.conversationText}>
                <span className={styles.title}>{conversation.label}</span>
                <span className={styles.conversationMeta}>
                  {conversation.lastMessage?.body ?? 'No messages yet'}
                </span>
              </span>
              {conversation.unreadCount > 0 ? <span className={styles.unread}>{conversation.unreadCount}</span> : null}
            </button>
          ))}

          {!conversationsQuery.isLoading && conversations.length === 0 ? (
            <p className={styles.empty}>Join a community to open its chat room.</p>
          ) : null}
        </div>
      </aside>

      <div className={styles.panel}>
        <header className={styles.chatHeader}>
          <div className={styles.conversationText}>
            <div className={styles.title}>{activeConversation?.label ?? 'Select a chat'}</div>
            <div className={styles.subtitle}>
              {isPendingConversation ? 'Opening direct message' : activeConversation?.type === 'community' ? 'Community room' : 'Direct message'}
            </div>
          </div>
        </header>

        <div className={styles.messages}>
          {!isPendingConversation && messagesQuery.hasNextPage ? (
            <Button
              className={styles.loadOlder}
              variant='outline'
              size='sm'
              isLoading={messagesQuery.isFetchingNextPage}
              onClick={() => void messagesQuery.fetchNextPage()}
            >
              Load older
            </Button>
          ) : null}

          {messages.map(message => {
            const isOwn = message.authorID === profile.id;
            return (
              <article
                key={message.id}
                className={classNames(styles.message, { [styles.messageOwn]: isOwn })}
              >
                <UserAvatar user={message.author} size='sm' />
                <div className={styles.bubble}>
                  <div className={styles.messageMeta}>
                    <span>{isOwn ? 'You' : message.author.displayName ?? message.author.userName}</span>
                    <span>{dayjs(message.createdAt).format('h:mm A')}</span>
                  </div>
                  <div className={styles.body}>{message.body}</div>
                </div>
              </article>
            );
          })}

          {!messagesQuery.isLoading && activeConversation && messages.length === 0 ? (
            <p className={styles.empty}>{isPendingConversation ? 'Opening chat...' : 'Start the conversation.'}</p>
          ) : null}
          {!activeConversation ? <p className={styles.empty}>Select a conversation.</p> : null}
        </div>

        <form className={styles.composer} onSubmit={submit}>
          <textarea
            className={styles.input}
            value={draft}
            maxLength={2000}
            rows={1}
            placeholder={isPendingConversation ? 'Opening chat...' : activeConversation ? 'Message...' : 'Select a chat first'}
            disabled={!activeConversation || isPendingConversation}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button size='icon' aria-label='Send message' disabled={!activeConversation || isPendingConversation || !draft.trim()}>
            <Send />
          </Button>
        </form>
      </div>
    </section>
  );
};
