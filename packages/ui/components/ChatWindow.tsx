'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Document } from '@langchain/core/documents';
import Navbar from './Navbar';
import Chat from './Chat';
import EmptyChat from './EmptyChat';
import crypto from 'crypto';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { getSuggestions } from '@/lib/actions';
import Error from 'next/error';
import {
  trackConversationStart,
  trackUserMessage,
  initUserFeedbackStats,
} from '@/lib/posthog';

export type Message = {
  messageId: string;
  chatId: string;
  createdAt: Date;
  content: string;
  role: 'user' | 'assistant';
  suggestions?: string[];
  sources?: Document[];
};

const useSocket = (
  url: string,
  setIsWSReady: (ready: boolean) => void,
  setError: (error: boolean) => void,
) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [reconnectStatus, setReconnectStatus] = useState<{
    attempts: number;
    isReconnecting: boolean;
    maxAttempts: number;
  }>({
    attempts: 0,
    isReconnecting: false,
    maxAttempts: 5,
  });
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isHostedMode = process.env.NEXT_PUBLIC_HOSTED_MODE === 'true';

  const connectWebSocket = useCallback(async () => {
    let chatModel = localStorage.getItem('chatModel');
    let chatModelProvider = localStorage.getItem('chatModelProvider');
    let embeddingModel = localStorage.getItem('embeddingModel');
    let embeddingModelProvider = localStorage.getItem('embeddingModelProvider');

    const wsURL = new URL(url);
    const searchParams = new URLSearchParams({});

    if (!isHostedMode) {
      const providers = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/models`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ).then(async (res) => await res.json());

      if (
        !chatModel ||
        !chatModelProvider ||
        !embeddingModel ||
        !embeddingModelProvider
      ) {
        if (!chatModel || !chatModelProvider) {
          const chatModelProviders = providers.chatModelProviders;

          chatModelProvider = Object.keys(chatModelProviders)[0];

          if (chatModelProvider === 'custom_openai') {
            toast.error(
              'Seems like you are using the custom OpenAI provider, please open the settings and configure the API key and base URL',
            );
            setError(true);
            return;
          } else {
            chatModel = Object.keys(chatModelProviders[chatModelProvider])[0];
            if (
              !chatModelProviders ||
              Object.keys(chatModelProviders).length === 0
            )
              return toast.error('No chat models available');
          }
        }

        if (!embeddingModel || !embeddingModelProvider) {
          const embeddingModelProviders = providers.embeddingModelProviders;

          if (
            !embeddingModelProviders ||
            Object.keys(embeddingModelProviders).length === 0
          )
            return toast.error('No embedding models available');

          embeddingModelProvider = Object.keys(embeddingModelProviders)[0];
          embeddingModel = Object.keys(
            embeddingModelProviders[embeddingModelProvider],
          )[0];
        }

        localStorage.setItem('chatModel', chatModel!);
        localStorage.setItem('chatModelProvider', chatModelProvider);
        localStorage.setItem('embeddingModel', embeddingModel!);
        localStorage.setItem('embeddingModelProvider', embeddingModelProvider);
      } else {
        const chatModelProviders = providers.chatModelProviders;
        const embeddingModelProviders = providers.embeddingModelProviders;

        if (
          Object.keys(chatModelProviders).length > 0 &&
          !chatModelProviders[chatModelProvider]
        ) {
          chatModelProvider = Object.keys(chatModelProviders)[0];
          localStorage.setItem('chatModelProvider', chatModelProvider);
        }

        if (
          chatModelProvider &&
          chatModelProvider != 'custom_openai' &&
          !chatModelProviders[chatModelProvider][chatModel]
        ) {
          chatModel = Object.keys(chatModelProviders[chatModelProvider])[0];
          localStorage.setItem('chatModel', chatModel);
        }

        if (
          Object.keys(embeddingModelProviders).length > 0 &&
          !embeddingModelProviders[embeddingModelProvider]
        ) {
          embeddingModelProvider = Object.keys(embeddingModelProviders)[0];
          localStorage.setItem(
            'embeddingModelProvider',
            embeddingModelProvider,
          );
        }

        if (
          embeddingModelProvider &&
          !embeddingModelProviders[embeddingModelProvider][embeddingModel]
        ) {
          embeddingModel = Object.keys(
            embeddingModelProviders[embeddingModelProvider],
          )[0];
          localStorage.setItem('embeddingModel', embeddingModel);
        }
      }
      searchParams.append('chatModel', chatModel!);
      searchParams.append('chatModelProvider', chatModelProvider);

      if (chatModelProvider === 'custom_openai') {
        searchParams.append(
          'openAIApiKey',
          localStorage.getItem('openAIApiKey')!,
        );
        searchParams.append(
          'openAIBaseURL',
          localStorage.getItem('openAIBaseURL')!,
        );
      }

      searchParams.append('embeddingModel', embeddingModel!);
      searchParams.append('embeddingModelProvider', embeddingModelProvider);
    }

    wsURL.search = searchParams.toString();

    const newWs = new WebSocket(wsURL.toString());

    const timeoutId = setTimeout(() => {
      if (newWs.readyState !== 1) {
        toast.error('Failed to connect to the server. Please try again later.');
      }
    }, 10000);

    newWs.onopen = () => {
      console.log('[DEBUG] open');
      clearTimeout(timeoutId);
      setIsWSReady(true);
      setError(false);
      setReconnectStatus((prev) => ({
        ...prev,
        attempts: 0,
        isReconnecting: false,
      }));
    };

    newWs.onerror = () => {
      clearTimeout(timeoutId);
      setError(true);
      toast.error('WebSocket connection error.');
    };

    newWs.onclose = () => {
      clearTimeout(timeoutId);
      console.log('[DEBUG] closed');
      setIsWSReady(false);

      setReconnectStatus((prev) => {
        const newAttempts = prev.attempts + 1;
        if (newAttempts <= prev.maxAttempts) {
          setError(true);
          console.log(`[DEBUG] reconnect attempt ${newAttempts}`);

          const delay = Math.min(1000 * 2 ** newAttempts, 30000);

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[DEBUG] attempting to reconnect');
            connectWebSocket();
          }, delay);

          return { ...prev, attempts: newAttempts, isReconnecting: true };
        } else {
          setError(true);
          toast.error(
            'Failed to connect after multiple attempts. Please try again later.',
          );
          return { ...prev, attempts: newAttempts, isReconnecting: false };
        }
      });
    };

    newWs.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'error') {
        toast.error(data.data);
      }
    });

    setWs(newWs);
  }, [url, isHostedMode, setError, setIsWSReady]);

  useEffect(() => {
    if (!ws) {
      connectWebSocket();
    }

    return () => {
      if (ws?.readyState === 1) {
        ws?.close();
        console.log('[DEBUG] closed');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [ws, connectWebSocket]);

  return { ws, reconnectStatus };
};

const loadMessages = async (
  chatId: string,
  setMessages: (messages: Message[]) => void,
  setIsMessagesLoaded: (loaded: boolean) => void,
  setChatHistory: (history: [string, string][]) => void,
  setFocusMode: (mode: string) => void,
  setNotFound: (notFound: boolean) => void,
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/chats/${chatId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (res.status === 404) {
    setNotFound(true);
    setIsMessagesLoaded(true);
    return;
  }

  const data = await res.json();

  const messages = data.messages.map((msg: any) => {
    return {
      ...msg,
      ...JSON.parse(msg.metadata),
    };
  }) as Message[];

  setMessages(messages);

  const history = messages.map((msg) => {
    return [msg.role, msg.content];
  }) as [string, string][];

  console.log('[DEBUG] messages loaded');

  document.title = messages[0].content;

  setChatHistory(history);
  setFocusMode(data.chat.focusMode);
  setIsMessagesLoaded(true);
};

export type StoredChat = {
  id: string;
  title: string;
  messages: Message[];
  focusMode: string;
  createdAt: Date;
  updatedAt: Date;
};

const saveMessagesToLocalStorage = (
  chatId: string,
  messages: Message[],
  focusMode: string,
) => {
  const existingChats = JSON.parse(
    localStorage.getItem('chats') || '[]',
  ) as StoredChat[];
  const chatIndex = existingChats.findIndex((chat) => chat.id === chatId);

  const updatedChat: StoredChat = {
    id: chatId,
    title: messages[0].content,
    messages,
    focusMode,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  console.log('[DEBUG] saving messages to local storage', updatedChat);

  if (chatIndex !== -1) {
    existingChats[chatIndex] = updatedChat;
  } else {
    existingChats.push(updatedChat);
  }

  localStorage.setItem('chats', JSON.stringify(existingChats));
};

const loadMessagesFromLocalStorage = (
  chatId: string,
): { messages: Message[]; focusMode: string } | null => {
  const existingChats = JSON.parse(
    localStorage.getItem('chats') || '[]',
  ) as StoredChat[];
  const chat = existingChats.find((chat) => chat.id === chatId);

  if (chat) {
    return { messages: chat.messages, focusMode: chat.focusMode };
  }

  return null;
};

const ChatWindow = ({ id }: { id?: string }) => {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('q');

  const [chatId, setChatId] = useState<string | undefined>(id);
  const [newChatCreated, setNewChatCreated] = useState(false);

  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [isWSReady, setIsWSReady] = useState(false);
  const { ws, reconnectStatus } = useSocket(
    process.env.NEXT_PUBLIC_WS_URL!,
    setIsWSReady,
    setHasError,
  );

  const DEFAULT_FOCUS_MODE = 'starknetEcosystemSearch';

  const [loading, setLoading] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);

  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [focusMode, setFocusMode] = useState(DEFAULT_FOCUS_MODE);

  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);

  const [notFound, setNotFound] = useState(false);

  const isHostedMode = process.env.NEXT_PUBLIC_HOSTED_MODE === 'true';

  useEffect(() => {
    if (
      chatId &&
      !newChatCreated &&
      !isMessagesLoaded &&
      messages.length === 0
    ) {
      if (isHostedMode) {
        const storedMessages = loadMessagesFromLocalStorage(chatId);
        setMessages(storedMessages?.messages || []);
        setFocusMode(storedMessages?.focusMode || DEFAULT_FOCUS_MODE);
        const history = storedMessages?.messages.map((msg) => {
          return [msg.role, msg.content];
        }) as [string, string][];
        setChatHistory(history);
        setIsMessagesLoaded(true);
      } else {
        loadMessages(
          chatId,
          setMessages,
          setIsMessagesLoaded,
          setChatHistory,
          setFocusMode,
          setNotFound,
        );
      }
    } else if (!chatId) {
      setNewChatCreated(true);
      setIsMessagesLoaded(true);
      setChatId(crypto.randomBytes(20).toString('hex'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Initialize PostHog user feedback stats when the component mounts
    initUserFeedbackStats();
  }, []);

  useEffect(() => {
    if (isMessagesLoaded && isWSReady && chatId) {
      // Track conversation start if this is a new chat
      if (newChatCreated) {
        trackConversationStart(focusMode, chatId);
      }
      setIsReady(true);
    }
  }, [isMessagesLoaded, isWSReady, chatId, newChatCreated, focusMode]);

  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMessagesLoaded && isWSReady) {
      setIsReady(true);
    }
  }, [isMessagesLoaded, isWSReady]);

  const sendMessage = async (message: string) => {
    if (loading) return;
    setLoading(true);
    setMessageAppeared(false);

    let sources: Document[] | undefined = undefined;
    let recievedMessage = '';
    let added = false;

    const messageId = crypto.randomBytes(7).toString('hex');

    ws?.send(
      JSON.stringify({
        type: 'message',
        message: {
          chatId: chatId!,
          content: message,
        },
        focusMode: focusMode,
        history: [...chatHistory, ['human', message]],
      }),
    );

    // Emit event when a user message is sent.
    trackUserMessage(message.length);

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: message,
        messageId: messageId,
        chatId: chatId!,
        role: 'user',
        createdAt: new Date(),
      },
    ]);

    const messageHandler = async (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      if (data.type === 'error') {
        toast.error(data.data);
        setLoading(false);
        return;
      }

      if (data.type === 'sources') {
        sources = data.data;
        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: '',
              messageId: data.messageId,
              chatId: chatId!,
              role: 'assistant',
              sources: sources,
              createdAt: new Date(),
            },
          ]);
          added = true;
        }
        setMessageAppeared(true);
      }

      if (data.type === 'message') {
        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: data.data,
              messageId: data.messageId,
              chatId: chatId!,
              role: 'assistant',
              sources: sources,
              createdAt: new Date(),
            },
          ]);
          added = true;
        }

        setMessages((prev) =>
          prev.map((message) => {
            if (message.messageId === data.messageId) {
              return { ...message, content: message.content + data.data };
            }

            return message;
          }),
        );

        recievedMessage += data.data;
        setMessageAppeared(true);
      }

      if (data.type === 'messageEnd') {
        setChatHistory((prevHistory) => [
          ...prevHistory,
          ['human', message],
          ['assistant', recievedMessage],
        ]);

        ws?.removeEventListener('message', messageHandler);
        setLoading(false);
        if (isHostedMode) {
          const humanMessage: Message = {
            content: message,
            messageId: messageId,
            chatId: chatId!,
            role: 'user',
            createdAt: new Date(),
          };
          const assistantMessage: Message = {
            content: recievedMessage,
            messageId: data.messageId,
            chatId: chatId!,
            role: 'assistant',
            createdAt: new Date(),
          };
          saveMessagesToLocalStorage(
            chatId!,
            [...messages, humanMessage, assistantMessage],
            focusMode,
          );
        }

        const lastMsg = messagesRef.current[messagesRef.current.length - 1];

        if (
          lastMsg.role === 'assistant' &&
          lastMsg.sources &&
          lastMsg.sources.length > 0 &&
          !lastMsg.suggestions
        ) {
          const suggestions = await getSuggestions(messagesRef.current);
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.messageId === lastMsg.messageId) {
                return { ...msg, suggestions: suggestions };
              }
              return msg;
            }),
          );
        }
      }
    };

    ws?.addEventListener('message', messageHandler);
  };

  const rewrite = (messageId: string) => {
    const index = messages.findIndex((msg) => msg.messageId === messageId);

    if (index === -1) return;

    const message = messages[index - 1];

    setMessages((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });
    setChatHistory((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });

    sendMessage(message.content);
  };

  useEffect(() => {
    if (isReady && initialMessage) {
      sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, initialMessage]);

  if (hasError) {
    toast.error(
      reconnectStatus.isReconnecting
        ? `Attempting to reconnect... (Attempt ${reconnectStatus.attempts}/${reconnectStatus.maxAttempts})`
        : reconnectStatus.attempts >= reconnectStatus.maxAttempts
          ? 'Failed to connect after multiple attempts. Please try again later.'
          : 'Failed to connect to the server. Please try again later.',
    );
  }

  return isReady || messages.length > 0 ? (
    notFound ? (
      <Error statusCode={404} />
    ) : (
      <div>
        {messages.length > 0 ? (
          <>
            <Navbar messages={messages} />
            <Chat
              loading={loading}
              messages={messages}
              sendMessage={sendMessage}
              messageAppeared={messageAppeared}
              rewrite={rewrite}
            />
          </>
        ) : (
          <EmptyChat
            sendMessage={sendMessage}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
          />
        )}
      </div>
    )
  ) : (
    <div className="flex flex-row items-center justify-center min-h-screen">
      <svg
        aria-hidden="true"
        className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  );
};
export default ChatWindow;
