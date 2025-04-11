import { Bot } from 'lucide-react';

const MessageBoxLoading = () => {
  return (
    <div className="flex w-full justify-start items-start space-x-2">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <Bot size={20} className="text-blue-600 dark:text-blue-300" />
      </div>
      <div className="flex flex-col space-y-2 max-w-[80%]">
        <div className="rounded-2xl px-4 py-2 bg-gray-100 dark:bg-gray-800">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBoxLoading;
