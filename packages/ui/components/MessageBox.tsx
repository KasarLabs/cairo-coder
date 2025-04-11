'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState } from 'react';
import { Message } from './ChatWindow';
import { cn } from '@/lib/utils';
import {
  BookCopy,
  Layers3,
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import MessageSources from './MessageSources';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { trackFeedback } from '@/lib/posthog';
import { Document } from '@langchain/core/documents';

// Common styling patterns (unchanged)
const styles = {
  messageBubble: {
    base: 'rounded-2xl px-3 sm:px-4 py-2',
    user: 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white',
    assistant: 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white',
  },
  inlineCode: {
    base: 'px-1 sm:px-1.5 py-0.5 rounded-md font-mono text-[0.85em] sm:text-[0.9em] break-words whitespace-normal',
    user: 'bg-grey-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200',
    assistant:
      'bg-grey-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200',
  },
  codeBlock: {
    base: 'relative group rounded-lg overflow-hidden',
    header:
      'absolute top-0 left-0 right-0 h-7 sm:h-8 bg-gray-800/50 dark:bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/20',
    background: 'bg-[#1E1E1E]',
    border: 'border border-gray-800',
    padding: 'px-3 sm:px-4 py-2 sm:py-3',
    fontSize: 'text-[13px] sm:text-sm',
    wrapper: 'overflow-x-auto whitespace-pre-wrap break-words mt-3 sm:mt-5',
  },
  copyButton: {
    base: cn(
      'absolute right-1 sm:right-2 top-1 sm:top-2 p-1 sm:p-1.5 rounded-md bg-gray-700/50 backdrop-blur-sm',
      'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
      'hover:bg-gray-700/70',
    ),
  },
  avatar: {
    base: 'flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center',
    assistant: 'bg-blue-100 dark:bg-blue-900',
    assistantIcon: 'text-blue-600 dark:text-blue-300',
    user: 'bg-blue-600',
    userIcon: 'text-white',
  },
  messageContainer: {
    base: 'flex flex-col space-y-1.5 sm:space-y-2',
    maxWidth: 'max-w-[90%] sm:max-w-[85%] md:max-w-[80%]',
    user: 'items-end',
    assistant: 'items-start',
  },
  prose: {
    base: cn(
      'prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0',
      'max-w-none break-words text-sm sm:text-base',
      'prose-pre:overflow-x-auto prose-pre:scrollbar-thin prose-pre:scrollbar-thumb-gray-400 prose-pre:scrollbar-track-gray-200',
      'dark:prose-pre:scrollbar-thumb-gray-600 dark:prose-pre:scrollbar-track-gray-800',
    ),
    user: 'prose-headings:text-white prose-p:text-grey dark:prose-headings:text-white dark:prose-p:text-white',
  },
  sources: {
    container: 'mt-2 transition-all',
    header: cn(
      'flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400',
      'hover:text-gray-700 dark:hover:text-gray-200 transition-colors',
      'cursor-pointer select-none',
    ),
    content: 'mt-2 pl-6 border-l-2 border-gray-200 dark:border-gray-700',
    icon: 'w-4 h-4 rotate-180 transition-transform duration-200',
  },
  suggestions: {
    container: 'mt-4 transition-all',
    header: cn(
      'flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400',
      'hover:text-gray-700 dark:hover:text-gray-200 transition-colors',
      'cursor-pointer select-none',
    ),
    content: 'mt-2 space-y-2',
    button: cn(
      'w-full text-left px-3 py-2 rounded-lg',
      'bg-gray-100 dark:bg-gray-800/50',
      'hover:bg-gray-200 dark:hover:bg-gray-700/50',
      'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
      'transition-colors text-sm text-gray-700 dark:text-gray-300',
    ),
  },
  actions: {
    container: 'flex items-center gap-1 mt-2',
    button: cn(
      'p-1.5 rounded-lg text-gray-500 dark:text-gray-400',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
      'transition-colors',
    ),
  },
  latex: {
    inline: 'mx-1 text-current',
    block: 'my-4 text-center overflow-x-auto py-2 px-4',
    container: 'bg-gray-50 dark:bg-gray-900 rounded-lg',
  },
} as const;

// Custom component for rendering LaTeX formulas
const LatexRenderer = ({
  isBlock = false,
  children,
}: {
  isBlock?: boolean;
  children: React.ReactNode;
}) => {
  // Ensure children is a string, handling different React child types
  const getFormulaText = (children: React.ReactNode): string => {
    if (typeof children === 'string') {
      return children.trim();
    } else if (Array.isArray(children)) {
      return children.map((child) => getFormulaText(child)).join('');
    } else if (React.isValidElement(children)) {
      return getFormulaText(children.props.children || '');
    } else if (children === null || children === undefined) {
      return '';
    } else {
      return String(children).trim();
    }
  };

  const formula = getFormulaText(children);

  const CopyButton = () => (
    <button
      onClick={() => navigator.clipboard.writeText(formula)}
      className={cn(styles.copyButton.base)}
      title="Copy formula"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-300 hover:text-white"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
    </button>
  );

  try {
    return isBlock ? (
      <div
        className={cn(
          styles.codeBlock.base,
          styles.codeBlock.border,
          'relative group',
        )}
      >
        <CopyButton />
        <div className={cn(styles.latex.block, styles.latex.container)}>
          <BlockMath math={formula} />
        </div>
      </div>
    ) : (
      <span className={styles.latex.inline}>
        <InlineMath math={formula} />
      </span>
    );
  } catch (error) {
    console.error('LaTeX rendering error:', error);
    return <code>{formula}</code>;
  }
};

// Custom component for rendering code blocks
const CodeBlock = ({
  language,
  children,
  isComplete,
}: {
  language: string;
  children: string;
  isComplete: boolean;
}) => {
  const codeBlockClass = cn(
    styles.codeBlock.base,
    styles.codeBlock.background,
    styles.codeBlock.border,
    !isComplete && 'animate-pulse',
  );

  const CopyButton = () => (
    <button
      onClick={() => navigator.clipboard.writeText(children)}
      className={cn(styles.copyButton.base, !isComplete && 'hidden')}
      title="Copy code"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-300 hover:text-white"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
    </button>
  );

  return (
    <div className={codeBlockClass}>
      {language !== 'text' && (
        <div className={styles.codeBlock.header}>
          <div className="flex items-center h-full px-2 sm:px-4">
            <span className="text-xs text-gray-400">{language}</span>
          </div>
        </div>
      )}
      <CopyButton />
      <div
        className={cn(
          styles.codeBlock.wrapper,
          language !== 'text' ? 'pt-7 sm:pt-8' : '',
          styles.codeBlock.padding,
        )}
      >
        <SyntaxHighlighter
          language={language === 'cairo' ? 'rust' : language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            background: 'transparent',
            fontSize: 'inherit',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
          className={styles.codeBlock.fontSize}
          wrapLines={true}
          wrapLongLines={true}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Update the MessageFeedback component to use our unified tracking function
const MessageFeedback = ({
  messageId,
  chatId,
  conversationHistory,
  content,
  sources,
}: {
  messageId: string;
  chatId: string;
  conversationHistory: string;
  content: string;
  sources?: Document[];
}) => {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(
    null,
  );
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleFeedback = (type: 'positive' | 'negative') => {
    // Don't set the same feedback twice
    if (feedback === type) return;

    setFeedback(type);

    // Track the feedback using our unified function
    // For positive feedback, we don't need to collect additional comments
    if (type === 'positive') {
      trackFeedback(
        type,
        chatId,
        messageId,
        content,
        undefined,
        undefined,
        sources,
      );
    } else {
      // For negative feedback, show the modal for additional comments
      setShowFeedbackModal(true);
      // We'll track the negative feedback after the user submits the comment or closes the modal
    }
  };

  const submitFeedbackText = () => {
    // Track the feedback with comment using our unified function
    trackFeedback(
      'negative',
      chatId,
      messageId,
      content,
      conversationHistory,
      feedbackText,
      sources,
    );

    setShowFeedbackModal(false);
  };

  // If the user closes the modal without submitting a comment, still track the negative feedback
  const handleCloseModal = () => {
    if (feedback === 'negative') {
      trackFeedback(
        'negative',
        chatId,
        messageId,
        content,
        undefined,
        undefined,
        sources,
      );
    }
    setShowFeedbackModal(false);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 mr-1">
          Was this response helpful?
        </div>
        <button
          onClick={() => handleFeedback('positive')}
          className={cn(
            'p-1 rounded-md transition-colors',
            feedback === 'positive'
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
          )}
          aria-label="Thumbs up"
        >
          <ThumbsUp size={16} />
        </button>
        <button
          onClick={() => handleFeedback('negative')}
          className={cn(
            'p-1 rounded-md transition-colors',
            feedback === 'negative'
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
          )}
          aria-label="Thumbs down"
        >
          <ThumbsDown size={16} />
        </button>
        {feedback && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            {feedback === 'positive'
              ? 'Thanks for your feedback!'
              : 'Thanks for your feedback.'}
          </span>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">
              What was wrong with this response?
            </h4>
            <button
              onClick={handleCloseModal}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full p-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Please describe the issue (optional)"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={submitFeedbackText}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
}) => {
  const [parsedContent, setParsedContent] = useState<React.ReactNode[]>([]);
  const [showSources, setShowSources] = useState(isLast);
  const [showSuggestions, setShowSuggestions] = useState(isLast);
  const isUser = message.role === 'user';

  useEffect(() => {
    const parseContent = (content: string) => {
      const parts: React.ReactNode[] = [];
      const lines = content.split('\n');
      let inCodeBlock = false;
      let inLatexBlock = false;
      let codeContent = '';
      let latexContent = '';
      let codeLanguage = 'text';
      let currentText = '';

      for (const line of lines) {
        // Check if it's a line with code. Trim is not fine as it can be with bullet points
        // like * ```cairo
        const isFencedCodeLine = line.includes('```');
        const languageMatch = line.match(/```(\w+)/);
        const language = languageMatch ? languageMatch[1] : '';
        const lineWithoutCodeAndLanguage = line
          .replace('```', '')
          .replace(language, '')
          .trim();
        if (isFencedCodeLine && !inCodeBlock && !inLatexBlock) {
          // Start of code block
          if (currentText) {
            parts.push(<Markdown key={parts.length}>{currentText}</Markdown>);
            currentText = lineWithoutCodeAndLanguage;
          }

          // Check if this is a math block
          if (language === 'math' || language === 'latex') {
            inLatexBlock = true;
            latexContent = '';
          } else {
            inCodeBlock = true;
            codeLanguage = language || 'text';
            codeContent = '';
          }
        } else if (line.trim() === '```' && (inCodeBlock || inLatexBlock)) {
          // End of code or LaTeX block
          if (inCodeBlock) {
            inCodeBlock = false;
            parts.push(
              <CodeBlock
                key={parts.length}
                language={codeLanguage}
                isComplete={true}
              >
                {codeContent}
              </CodeBlock>,
            );
            codeContent = '';
          } else if (inLatexBlock) {
            inLatexBlock = false;
            parts.push(
              <LatexRenderer key={parts.length} isBlock={true}>
                {latexContent.trim()}
              </LatexRenderer>,
            );
            latexContent = '';
          }
        } else if (
          line.trim().startsWith('$$') &&
          !inLatexBlock &&
          !inCodeBlock
        ) {
          // Start of LaTeX block
          if (currentText) {
            parts.push(<Markdown key={parts.length}>{currentText}</Markdown>);
            currentText = '';
          }
          inLatexBlock = true;
          latexContent = line.trim().substring(2).trim();
        } else if (line.trim().endsWith('$$') && inLatexBlock) {
          // End of LaTeX block
          const endContent = line.trim();
          const endIndex = endContent.lastIndexOf('$$');
          latexContent += ' ' + endContent.substring(0, endIndex).trim();
          inLatexBlock = false;
          parts.push(
            <LatexRenderer key={parts.length} isBlock={true}>
              {latexContent}
            </LatexRenderer>,
          );
          latexContent = '';
        } else if (inCodeBlock) {
          // Inside code block
          codeContent += line + '\n';
        } else if (inLatexBlock) {
          // Inside LaTeX block
          latexContent += line + '\n';
        } else {
          // Regular text with possible inline LaTeX
          const processedLine = processInlineLatex(line);
          currentText += processedLine + '\n';
        }
      }

      // Handle incomplete content
      if (currentText) {
        parts.push(<Markdown key={parts.length}>{currentText}</Markdown>);
      }
      if (inCodeBlock && codeContent) {
        // Handle incomplete code block
        parts.push(
          <CodeBlock
            key={parts.length}
            language={codeLanguage}
            isComplete={false}
          >
            {codeContent.trim()}
          </CodeBlock>,
        );
      }
      if (inLatexBlock && latexContent) {
        // Handle incomplete LaTeX block (from either $$ or ```math)
        parts.push(
          <LatexRenderer key={parts.length} isBlock={true}>
            {latexContent.trim()}
          </LatexRenderer>,
        );
      }

      return parts;
    };

    // Process inline LaTeX expressions ($...$)
    const processInlineLatex = (text: string) => {
      // Replace inline LaTeX with placeholders to avoid conflicts with markdown
      const latexPlaceholders: { placeholder: string; formula: string }[] = [];
      let placeholderIndex = 0;

      // Find all inline LaTeX expressions ($...$) that are not escaped
      // This regex looks for $ that is not preceded by a backslash,
      // then captures everything until the next unescaped $
      const processedText = text.replace(
        /(?<!\\\$)\$((?:[^\$\\]|\\[\s\S])+?)\$/g,
        (match, formula) => {
          const placeholder = `__LATEX_PLACEHOLDER_${placeholderIndex}__`;
          latexPlaceholders.push({ placeholder, formula: formula.trim() });
          placeholderIndex++;
          return placeholder;
        },
      );

      // If no LaTeX formulas found, return the original text
      if (latexPlaceholders.length === 0) {
        return text;
      }

      // Replace placeholders with actual LaTeX components in the rendered markdown
      return processedText.replace(
        /__LATEX_PLACEHOLDER_(\d+)__/g,
        (match, index) => {
          const { formula } = latexPlaceholders[parseInt(index, 10)];
          return `<latex-inline>${formula}</latex-inline>`;
        },
      );
    };

    const contentWithSources =
      message.role === 'assistant' &&
      message.sources &&
      message.sources.length > 0
        ? message.content.replace(
            /\[(\d+)\]/g,
            (_, number) =>
              `<a href="${message.sources?.[number - 1]?.metadata?.url}" target="_blank" className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${number}</a>`,
          )
        : message.content;

    setParsedContent(parseContent(contentWithSources));
  }, [message.content, message.sources, message.role]);

  useEffect(() => {
    if (isLast) {
      setShowSources(true);
      setShowSuggestions(true);
    }
  }, [isLast]);

  // Custom overrides for markdown-to-jsx to handle LaTeX
  const markdownOptions = {
    overrides: {
      'latex-inline': {
        component: ({ children }: { children: string }) => (
          <LatexRenderer>{children}</LatexRenderer>
        ),
      },
    },
  };

  return (
    <div
      className={cn(
        'flex w-full items-start gap-2',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div
          className={cn(styles.avatar.base, styles.avatar.assistant)}
          role="img"
          aria-label="Assistant"
        >
          <Bot size={20} className={styles.avatar.assistantIcon} />
        </div>
      )}
      <div
        ref={dividerRef}
        className={cn(
          styles.messageContainer.base,
          styles.messageContainer.maxWidth,
          isUser
            ? styles.messageContainer.user
            : styles.messageContainer.assistant,
        )}
      >
        <div
          className={cn(
            styles.messageBubble.base,
            isUser ? styles.messageBubble.user : styles.messageBubble.assistant,
          )}
          role={isUser ? 'user message' : 'assistant message'}
        >
          <div className={cn(styles.prose.base, isUser && styles.prose.user)}>
            {parsedContent.map((part, index) => {
              if (React.isValidElement(part) && part.type === Markdown) {
                return (
                  <Markdown key={index} options={markdownOptions}>
                    {part.props.children}
                  </Markdown>
                );
              }
              return React.cloneElement(part as React.ReactElement, {
                key: index,
              });
            })}
          </div>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className={styles.sources.container}>
            <button
              onClick={() => setShowSources(!showSources)}
              className={styles.sources.header}
              aria-expanded={showSources}
            >
              <BookCopy
                className={cn(styles.sources.icon, !showSources && '!rotate-0')}
              />
              <span>Sources ({message.sources.length})</span>
            </button>
            {showSources && (
              <div className={styles.sources.content}>
                <MessageSources sources={message.sources} />
              </div>
            )}
          </div>
        )}

        {!loading && !isUser && (
          <div className={styles.actions.container}>
            <Rewrite
              rewrite={rewrite}
              messageId={message.messageId}
              className={styles.actions.button}
            />
            <Copy
              initialMessage={message.content}
              message={message}
              className={styles.actions.button}
            />
          </div>
        )}

        {message.suggestions &&
          message.suggestions.length > 0 &&
          !loading &&
          !isUser && (
            <div className={styles.suggestions.container}>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={styles.suggestions.header}
                aria-expanded={showSuggestions}
              >
                <Layers3
                  className={cn(
                    styles.sources.icon,
                    !showSuggestions && '!rotate-0',
                  )}
                />
                <span>Related questions ({message.suggestions.length})</span>
              </button>
              {showSuggestions && (
                <div className={styles.suggestions.content}>
                  {message.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className={styles.suggestions.button}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        {!isUser && !loading && (
          <MessageFeedback
            messageId={message.messageId}
            chatId={message.chatId}
            conversationHistory={history.map((h) => h.content).join('\n')}
            content={message.content}
            sources={message.sources}
          />
        )}
      </div>
      {isUser && (
        <div
          className={cn(styles.avatar.base, styles.avatar.user)}
          role="img"
          aria-label="User"
        >
          <User size={20} className={styles.avatar.userIcon} />
        </div>
      )}
    </div>
  );
};

export default MessageBox;
