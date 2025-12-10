/**
 * AI 聊天 Hook
 * 提供流式输出和上下文记忆功能
 */

import { useState, useCallback, useRef } from 'react';
import { 
  callAIStream, 
  callAIWithContext,
  getConversationHistory, 
  clearConversationHistory 
} from '../services/aiService';

/**
 * AI 聊天 Hook
 * @param {string} contextId - 上下文ID（如题目ID）
 * @param {object} options - 配置选项
 * @returns {object} 聊天状态和方法
 */
export const useAIChat = (contextId, options = {}) => {
  const { enableHistory = true } = options;
  
  const [messages, setMessages] = useState(() => {
    if (enableHistory && contextId) {
      return getConversationHistory(contextId);
    }
    return [];
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * 发送消息（流式）
   */
  const sendMessage = useCallback(async (prompt, messageOptions = {}) => {
    const { jsonMode = false, onChunk, onComplete } = messageOptions;
    
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);
    
    // 创建取消控制器
    abortControllerRef.current = new AbortController();
    
    try {
      const result = await callAIStream(prompt, {
        jsonMode,
        contextId: enableHistory ? contextId : null,
        useHistory: enableHistory,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk, fullContent) => {
          setStreamingContent(fullContent);
          onChunk?.(chunk, fullContent);
        },
        onComplete: (fullContent) => {
          setStreamingContent('');
          if (enableHistory) {
            setMessages(prev => [
              ...prev,
              { role: 'user', content: prompt },
              { role: 'assistant', content: fullContent }
            ]);
          }
          onComplete?.(fullContent);
        },
        onError: (err) => {
          setError(err);
        }
      });
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [contextId, enableHistory]);

  /**
   * 发送消息（非流式但带上下文）
   */
  const sendMessageSync = useCallback(async (prompt, messageOptions = {}) => {
    const { jsonMode = false } = messageOptions;
    
    setIsStreaming(true);
    setError(null);
    
    try {
      const result = await callAIWithContext(prompt, contextId, {
        jsonMode,
        stream: false
      });
      
      if (enableHistory) {
        setMessages(prev => [
          ...prev,
          { role: 'user', content: prompt },
          { role: 'assistant', content: result }
        ]);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsStreaming(false);
    }
  }, [contextId, enableHistory]);

  /**
   * 追问（基于上一轮对话继续）
   */
  const followUp = useCallback(async (prompt, messageOptions = {}) => {
    return sendMessage(prompt, messageOptions);
  }, [sendMessage]);

  /**
   * 取消当前流式请求
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, []);

  /**
   * 清除对话历史
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
    if (contextId) {
      clearConversationHistory(contextId);
    }
  }, [contextId]);

  /**
   * 重新加载历史
   */
  const reloadHistory = useCallback(() => {
    if (enableHistory && contextId) {
      setMessages(getConversationHistory(contextId));
    }
  }, [contextId, enableHistory]);

  return {
    messages,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    sendMessageSync,
    followUp,
    cancelStream,
    clearHistory,
    reloadHistory
  };
};

export default useAIChat;
