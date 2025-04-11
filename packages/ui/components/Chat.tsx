'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import { Message } from './ChatWindow';
import MessageBox from './MessageBox';
import MessageBoxLoading from './MessageBoxLoading';

const Chat = ({
  loading,
  messages,
  sendMessage,
  messageAppeared,
  rewrite,
}: {
  messages: Message[];
  sendMessage: (message: string) => void;
  loading: boolean;
  messageAppeared: boolean;
  rewrite: (messageId: string) => void;
}) => {
  const [dividerWidth, setDividerWidth] = useState(0);
  const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const messageEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateDividerWidth = () => {
      if (dividerRef.current) {
        setDividerWidth(dividerRef.current.scrollWidth);
      }
    };

    updateDividerWidth();
    window.addEventListener('resize', updateDividerWidth);
    return () => window.removeEventListener('resize', updateDividerWidth);
  }, []);

  useEffect(() => {
    if (messages.length > prevMessageCount) {
      messageEnd.current?.scrollIntoView({ behavior: 'smooth' });
      setPrevMessageCount(messages.length);
    }
  }, [messages.length, prevMessageCount]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pt-16 sm:pt-20 pb-32 sm:pb-36 lg:pb-32 px-2 sm:px-4 md:px-8">
        <div className="flex flex-col space-y-4 max-w-[95%] sm:max-w-[85%] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1;
            return (
              <Fragment key={msg.messageId}>
                <MessageBox
                  message={msg}
                  messageIndex={i}
                  history={messages}
                  loading={loading}
                  dividerRef={isLast ? dividerRef : undefined}
                  isLast={isLast}
                  rewrite={rewrite}
                  sendMessage={sendMessage}
                />
              </Fragment>
            );
          })}
          {loading && !messageAppeared && <MessageBoxLoading />}
          <div ref={messageEnd} className="h-0" />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-light-primary dark:bg-dark-primary border-t border-light-200 dark:border-dark-200 mb-[60px] lg:mb-0">
        <div className="max-w-[95%] sm:max-w-[85%] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-4 md:px-8">
          <MessageInput loading={loading} sendMessage={sendMessage} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
