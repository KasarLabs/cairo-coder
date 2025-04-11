'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DeleteChat from '@/components/DeleteChat';
import { StoredChat } from '@/components/ChatWindow';
import { trackHistoryPageViewed, trackHistoryItemClicked } from '@/lib/posthog';
import { v4 as uuidv4 } from 'uuid';

const ChatHistory = () => {
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionId] = useState(() => uuidv4());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedChats = JSON.parse(localStorage.getItem('chats') || '[]');
      setChats(storedChats);

      // Track history page view
      trackHistoryPageViewed(sessionId);
    }
  }, [sessionId]);

  // Sort chats so the most recent (by chat.createdAt) comes first.
  const sortedChats = [...chats].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Filter chats based on search term.
  const filteredChats = sortedChats.filter((chat) =>
    (chat.title || `Chat ${chat.id}`)
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  // Handle chat item click
  const handleChatClick = (chatId: string) => {
    trackHistoryItemClicked(chatId);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-2xl font-bold">Chat History</h1>
        <div className="flex gap-2 mt-2 md:mt-0">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 border border-light-200 dark:border-dark-200 rounded-md"
          />
          <button
            onClick={() => {
              if (window.confirm('Clear all chat history?')) {
                localStorage.removeItem('chats');
                setChats([]);
              }
            }}
            className="px-3 py-1 rounded-md bg-red-400 text-white hover:bg-red-500"
          >
            Clear All
          </button>
        </div>
      </div>
      {filteredChats.length === 0 ? (
        <p>No chats found.</p>
      ) : (
        <ul className="space-y-4">
          {filteredChats.map((chat) => (
            <li
              key={chat.title?.slice(0, 30) || chat.id}
              className="flex items-center justify-between p-4 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-200 dark:border-dark-200"
            >
              <div>
                <Link
                  href={`/c/${chat.id}`}
                  className="text-lg font-medium"
                  onClick={() => handleChatClick(chat.id)}
                >
                  {chat.title || `Chat ${chat.id}`}
                </Link>
                {chat.createdAt && (
                  <p className="text-sm text-gray-500">
                    {new Date(chat.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              <DeleteChat chatId={chat.id} chats={chats} setChats={setChats} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatHistory;
