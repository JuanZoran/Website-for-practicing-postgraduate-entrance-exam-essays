/**
 * 流式文本显示组件
 * 实时显示AI生成的内容，带打字机效果
 */

import { useState, useEffect, useRef } from 'react';
import { Loader, StopCircle } from 'lucide-react';

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

/**
 * 格式化聊天内容，增加颜色区分
 */
const formatChatContent = (text, isUser) => {
  if (!text || isUser) return text;
  
  const elements = [];
  let lastIndex = 0;
  const matches = [];
  
  // 匹配粗体 **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'bold' });
  }
  
  // 匹配引号内容 "text"
  const quoteRegex = /"([^"]+)"/g;
  while ((match = quoteRegex.exec(text)) !== null) {
    const overlaps = matches.some(m => 
      (match.index >= m.start && match.index < m.end) || 
      (match.index + match[0].length > m.start && match.index + match[0].length <= m.end)
    );
    if (!overlaps) {
      matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'quote' });
    }
  }
  
  // 按位置排序
  matches.sort((a, b) => a.start - b.start);
  
  // 构建结果
  matches.forEach((m, idx) => {
    if (m.start > lastIndex) {
      elements.push(<span key={`t${idx}`}>{text.slice(lastIndex, m.start)}</span>);
    }
    if (m.type === 'bold') {
      elements.push(
        <strong key={`b${idx}`} className="font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-1 rounded">
          {m.content}
        </strong>
      );
    } else if (m.type === 'quote') {
      elements.push(
        <span key={`q${idx}`} className="text-emerald-600 dark:text-emerald-400 font-medium">"{m.content}"</span>
      );
    }
    lastIndex = m.end;
  });
  
  if (lastIndex < text.length) {
    elements.push(<span key="last">{text.slice(lastIndex)}</span>);
  }
  
  return elements.length > 0 ? elements : text;
};

/**
 * 对话气泡组件
 */
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
          <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {formatChatContent(content, isUser)}
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
