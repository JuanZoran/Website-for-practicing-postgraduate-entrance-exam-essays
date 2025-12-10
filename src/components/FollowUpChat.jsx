/**
 * 追问对话组件
 * 支持在审题/润色后进行追问和迭代优化
 */

import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, ChevronDown, ChevronUp, MessageCircle, Loader } from 'lucide-react';
import { ChatList } from './StreamingText';
import { useAIChat } from '../hooks/useAIChat';

/**
 * 追问输入框
 */
const FollowUpInput = ({ onSend, isLoading, placeholder }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "继续追问..."}
        className="flex-1 resize-none bg-transparent border-none outline-none text-[15px] text-slate-700 dark:text-slate-200 placeholder-slate-400 min-h-[40px] max-h-[120px]"
        rows={1}
        disabled={isLoading}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        className={`p-2.5 rounded-xl transition-all ${
          input.trim() && !isLoading
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

/**
 * 追问对话面板
 */
export const FollowUpChat = ({
  contextId,
  initialContext = '',
  systemPrompt = '',
  title = '追问优化',
  placeholder = '有疑问？继续追问...',
  onNewResponse,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    messages,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    clearHistory
  } = useAIChat(contextId, { enableHistory: true });

  const handleSend = async (input) => {
    // 构建带上下文的提示词
    let prompt = input;
    if (systemPrompt && messages.length === 0) {
      prompt = `${systemPrompt}\n\n用户追问: ${input}`;
    }
    if (initialContext && messages.length === 0) {
      prompt = `基于以下内容:\n${initialContext}\n\n用户追问: ${input}`;
    }

    try {
      const result = await sendMessage(prompt, {
        onComplete: (content) => {
          onNewResponse?.(content);
        }
      });
      return result;
    } catch (err) {
      console.error('Follow-up error:', err);
    }
  };

  const handleClear = () => {
    clearHistory();
    setIsExpanded(false);
  };

  // 有消息时自动展开
  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      setIsExpanded(true);
    }
  }, [messages.length, isStreaming]);

  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden ${className}`}>
      {/* 头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-500" />
          <span className="font-medium text-slate-700 dark:text-slate-200">{title}</span>
          {messages.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full">
              {Math.floor(messages.length / 2)} 轮对话
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          {/* 对话列表 */}
          {(messages.length > 0 || isStreaming) && (
            <div className="p-4 max-h-[300px] overflow-y-auto">
              <ChatList
                messages={messages}
                streamingContent={streamingContent}
                isStreaming={isStreaming}
              />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <FollowUpInput
              onSend={handleSend}
              isLoading={isStreaming}
              placeholder={placeholder}
            />
          </div>

          {/* 清除按钮 */}
          {messages.length > 0 && (
            <div className="px-4 pb-3">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                清除对话
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 快捷追问按钮组
 */
export const QuickFollowUps = ({ suggestions, onSelect, disabled }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default FollowUpChat;
