import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const Rewrite = ({
  rewrite,
  messageId,
  className,
}: {
  rewrite: (messageId: string) => void;
  messageId: string;
  className?: string;
}) => {
  return (
    <button
      onClick={() => rewrite(messageId)}
      className={className}
      aria-label="Regenerate response"
      title="Regenerate"
    >
      <RefreshCw size={16} />
    </button>
  );
};

export default Rewrite;
