import { Check, Copy as CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '../ChatWindow';

const Copy = ({
  initialMessage,
  message,
  className,
}: {
  initialMessage: string;
  message: Message;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(initialMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className={className}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? (
        <Check size={16} className="text-green-500 dark:text-green-400" />
      ) : (
        <CopyIcon size={16} />
      )}
    </button>
  );
};

export default Copy;
