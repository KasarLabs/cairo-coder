import { Clock, Edit, Share, Trash } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState } from 'react';
import { formatTimeDifference } from '@/lib/utils';

const Navbar = ({ messages }: { messages: Message[] }) => {
  const [title, setTitle] = useState<string>('');
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (messages.length > 0) {
      const newTitle =
        messages[0].content.length > 20
          ? `${messages[0].content.substring(0, 20).trim()}...`
          : messages[0].content;
      setTitle(newTitle);
      const newTimeAgo = formatTimeDifference(
        new Date(),
        messages[0].createdAt,
      );
      setTimeAgo(newTimeAgo);
    }
  }, [messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (messages.length > 0) {
        const newTimeAgo = formatTimeDifference(
          new Date(),
          messages[0].createdAt,
        );
        setTimeAgo(newTimeAgo);
      }
    }, 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed z-40 top-0 left-0 right-0 px-4 lg:pl-[104px] lg:pr-6 lg:px-8 flex flex-row items-center justify-between w-full py-4 text-sm text-black dark:text-white/70 border-b bg-light-primary dark:bg-dark-primary border-light-100 dark:border-dark-200">
      <div className="hidden lg:flex flex-row items-center justify-center space-x-2">
        <Clock size={17} />
        <p className="text-xs">{timeAgo} ago</p>
      </div>
    </div>
  );
};

export default Navbar;
