import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, MessageCircle, Send, Loader, RotateCcw, Sparkles } from 'lucide-react';
import { ChatList } from './StreamingText';
import { useAIChat } from '../hooks/useAIChat';

const QUICK_QUESTIONS = [
  '这句啥意思？',
  '有替换表达吗？',
  '语法结构是什么？',
  '为什么用这个词？'
];

export const BottomDrawer = ({
  isOpen,
  onClose,
  selectedText,
  contextId,
  mode = 'essay',
  data,
  modelText,
  initialQuestion = ''
}) => {
  const [drawerHeight, setDrawerHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [input, setInput] = useState('');
  const drawerRef = useRef(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const inputRef = useRef(null);

  const {
    messages,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    clearHistory
  } = useAIChat(contextId, { enableHistory: true });

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const initialQuestionSentRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setDrawerHeight(50);
      setTimeout(() => inputRef.current?.focus(), 100);
      initialQuestionSentRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const newKeyboardHeight = windowHeight - viewportHeight;
        
        if (newKeyboardHeight > 100) {
          setKeyboardHeight(newKeyboardHeight);
          setDrawerHeight(Math.min(92, 60 + (newKeyboardHeight / windowHeight) * 30));
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleDragStart = useCallback((clientY) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = drawerHeight;
  }, [drawerHeight]);

  const handleDragMove = useCallback((clientY) => {
    if (!isDragging) return;
    
    const delta = dragStartY.current - clientY;
    const deltaPercent = (delta / window.innerHeight) * 100;
    const newHeight = Math.min(92, Math.max(30, dragStartHeight.current + deltaPercent));
    setDrawerHeight(newHeight);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (drawerHeight < 35) {
      onClose?.();
    } else if (drawerHeight < 50) {
      setDrawerHeight(50);
    } else if (drawerHeight > 80) {
      setDrawerHeight(92);
    }
  }, [drawerHeight, onClose]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => handleDragMove(e.clientY);
    const handleTouchMove = (e) => handleDragMove(e.touches[0].clientY);
    const handleEnd = () => handleDragEnd();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleSend = useCallback(async (questionText) => {
    const question = questionText || input.trim();
    const quote = selectedText?.trim();
    if (!question || isStreaming) return;

    const prompt = `你是一位考研英语写作老师。请基于【范文】与【选中片段】回答用户问题。

要求：
1) 用中文回答
2) 先解释含义（必要时给出更自然的译法）
3) 再讲语法结构/用词亮点/可替换表达（给2-3个替换）
4) 如选中片段有更地道写法，可给出改写版本

【题目】
${mode === 'letter' ? '小作文' : '大作文'} · ${data?.year || ''} ${data?.title || ''}

【范文】
${modelText || ''}

${quote ? `【选中片段】\n${quote}\n\n` : ''}【用户问题】
${question}`;

    try {
      await sendMessage(prompt);
      setInput('');
    } catch {
      // error handled by hook
    }
  }, [input, selectedText, isStreaming, mode, data, modelText, sendMessage]);

  useEffect(() => {
    if (isOpen && initialQuestion && !initialQuestionSentRef.current && !isStreaming) {
      initialQuestionSentRef.current = true;
      handleSend(initialQuestion);
    }
  }, [isOpen, initialQuestion, isStreaming, handleSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/30 z-50 animate-fadeIn md:hidden"
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
        style={{ height: `${drawerHeight}vh` }}
      >
        <div className="h-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800">
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>

          <div className="px-4 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">问 AI</span>
              {selectedText && (
                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                  {selectedText}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
            {messages.length === 0 && !isStreaming ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 text-center">
                  {selectedText ? '针对选中内容提问' : '输入问题或选择快捷追问'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      disabled={isStreaming}
                      className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ChatList
                messages={messages}
                streamingContent={streamingContent}
                isStreaming={isStreaming}
              />
            )}
            
            {error && (
              <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}
          </div>

          <div className="p-3 pb-safe border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedText ? '针对选中内容提问...' : '输入你的问题...'}
                className="flex-1 resize-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-[15px] text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[44px] max-h-[100px]"
                rows={1}
                disabled={isStreaming}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className={`p-3 rounded-xl transition-all ${
                  input.trim() && !isStreaming
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isStreaming ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {messages.length > 0 && !isStreaming && (
              <button
                onClick={clearHistory}
                className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                清空对话
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default BottomDrawer;
