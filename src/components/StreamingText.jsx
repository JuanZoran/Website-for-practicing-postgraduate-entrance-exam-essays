import { useEffect, useRef } from 'react';
import { Loader, StopCircle } from 'lucide-react';
import Markdown from 'react-markdown';

/**
 * 流式文本显示
 */
export const StreamingText = ({ 
  content, 
  isStreaming, 
  onCancel,
  className = '',
  showCursor = true 
}) => {
  const containerRef = useRef(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  if (!content && !isStreaming) return null;

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef}
        className="whitespace-pre-wrap break-words overflow-auto"
      >
        {content}
        {isStreaming && showCursor && (
          <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-0.5" />
        )}
      </div>
      
      {isStreaming && onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          title="停止生成"
        >
          <StopCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/**
 * 流式反馈卡片
 * 用于显示AI审题/润色等反馈
 */
export const StreamingFeedbackCard = ({
  title,
  content,
  isStreaming,
  onCancel,
  type = 'info', // info, success, warning, error
  icon: Icon
}) => {
  const typeStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  };

  const textStyles = {
    info: 'text-blue-800 dark:text-blue-200',
    success: 'text-green-800 dark:text-green-200',
    warning: 'text-amber-800 dark:text-amber-200',
    error: 'text-red-800 dark:text-red-200'
  };

  return (
    <div className={`p-4 rounded-2xl border ${typeStyles[type]} transition-all duration-300`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${textStyles[type]}`} />}
        {title && (
          <span className={`font-medium text-sm ${textStyles[type]}`}>
            {title}
          </span>
        )}
        {isStreaming && (
          <Loader className={`w-4 h-4 animate-spin ${textStyles[type]}`} />
        )}
      </div>
      
      <StreamingText
        content={content}
        isStreaming={isStreaming}
        onCancel={onCancel}
        className={`text-[15px] ${textStyles[type]}`}
      />
    </div>
  );
};

const MarkdownContent = ({ content, className = '' }) => (
  <Markdown
    className={`markdown-content ${className}`}
    components={{
      h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-slate-800 dark:text-slate-100">{children}</h1>,
      h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0 text-slate-800 dark:text-slate-100">{children}</h2>,
      h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-slate-700 dark:text-slate-200">{children}</h3>,
      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      strong: ({ children }) => <strong className="font-bold text-indigo-600 dark:text-indigo-300">{children}</strong>,
      em: ({ children }) => <em className="italic text-slate-600 dark:text-slate-300">{children}</em>,
      code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-sm font-mono text-emerald-600 dark:text-emerald-400">{children}</code>,
      blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-500 pl-3 py-1 my-2 bg-slate-50 dark:bg-slate-800/50 rounded-r">{children}</blockquote>,
    }}
  >
    {content}
  </Markdown>
);

export const ChatBubble = ({ 
  role, 
  content, 
  isStreaming = false,
  timestamp 
}) => {
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-br-md' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
        }`}>
          <div className="break-words text-[15px] leading-relaxed">
            {isUser ? content : <MarkdownContent content={content} />}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5 opacity-50" />
            )}
          </div>
        </div>
        {timestamp && (
          <div className={`text-[11px] text-slate-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 对话列表组件
 */
export const ChatList = ({ 
  messages, 
  streamingContent, 
  isStreaming,
  className = '' 
}) => {
  const listRef = useRef(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <div ref={listRef} className={`overflow-y-auto ${className}`}>
      {messages.map((msg, idx) => (
        <ChatBubble 
          key={idx} 
          role={msg.role} 
          content={msg.content}
          timestamp={msg.timestamp}
        />
      ))}
      
      {isStreaming && streamingContent && (
        <ChatBubble 
          role="assistant" 
          content={streamingContent}
          isStreaming={true}
        />
      )}
    </div>
  );
};

export default StreamingText;
