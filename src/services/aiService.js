/**
 * AI服务抽象层
 * 支持 DeepSeek、豆包、智谱AI
 * 集成使用量统计、提示词模板、流式输出和上下文记忆
 * 支持多提供商切换，每个提供商独立配置 API Key
 */

import { recordUsage, checkLimits, estimateTokens } from './usageService';
import { buildPrompt } from './promptService';
import { logError, getErrorDetails, parseErrorType, ERROR_TYPES } from './errorService';

const STORAGE_KEY = 'kaoyan_ai_provider';
const API_KEY_STORAGE_KEY = 'kaoyan_deepseek_api_key'; // 旧格式，保持向后兼容
const API_KEYS_STORAGE_KEY = 'kaoyan_ai_api_keys'; // 新格式，多提供商
const CONVERSATION_STORAGE_KEY = 'kaoyan_conversation_history';
const ZHIPU_THINKING_KEY = 'kaoyan_zhipu_thinking'; // 智谱AI深度思考配置
const DEFAULT_PROVIDER = 'deepseek';
const MAX_HISTORY_LENGTH = 10; // 最多保留10轮对话

/**
 * 获取所有可用的提供商列表
 */
export const getProviders = () => [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3.2)' }
    ],
    defaultModel: 'deepseek-chat'
  },
  {
    id: 'doubao',
    name: '豆包',
    models: [
      { id: 'doubao-1-5-pro-32k-250115', name: 'Doubao Pro 1.5 (32k)' }
    ],
    defaultModel: 'doubao-1-5-pro-32k-250115'
  },
  {
    id: 'zhipu',
    name: '智谱AI',
    models: [
      { id: 'glm-4.6', name: 'GLM-4.6' }
    ],
    defaultModel: 'glm-4.6'
  }
];

/**
 * 获取当前选择的提供商
 */
export const getCurrentProvider = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      return config.provider || DEFAULT_PROVIDER;
    }
  } catch (e) {
    console.warn('Failed to read provider config:', e);
  }
  return DEFAULT_PROVIDER;
};

/**
 * 获取当前选择的模型
 */
export const getCurrentModel = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      const providers = getProviders();
      const provider = providers.find(p => p.id === config.provider);
      if (provider) {
        return config.model || provider.defaultModel;
      }
    }
  } catch (e) {
    console.warn('Failed to read model config:', e);
  }
  const providers = getProviders();
  const defaultProvider = providers.find(p => p.id === DEFAULT_PROVIDER);
  return defaultProvider?.defaultModel || 'deepseek-chat';
};


/**
 * 保存提供商配置
 */
export const saveProviderConfig = (provider, model) => {
  try {
    const config = { provider, model };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save provider config:', e);
  }
};

/**
 * 获取智谱AI深度思考配置
 * @returns {boolean} 是否启用深度思考，默认false
 */
export const getZhipuThinking = () => {
  try {
    const stored = localStorage.getItem(ZHIPU_THINKING_KEY);
    if (stored !== null) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to read zhipu thinking config:', e);
  }
  return false; // 默认关闭
};

/**
 * 保存智谱AI深度思考配置
 * @param {boolean} enabled - 是否启用深度思考
 */
export const saveZhipuThinking = (enabled) => {
  try {
    localStorage.setItem(ZHIPU_THINKING_KEY, JSON.stringify(enabled));
  } catch (e) {
    console.error('Failed to save zhipu thinking config:', e);
  }
};

/**
 * 获取 API Key（支持多提供商）
 * @param {string} provider - 提供商ID，不传则返回当前提供商的Key
 * @returns {string} API Key
 */
export const getApiKey = (provider = null) => {
  try {
    const targetProvider = provider || getCurrentProvider();
    
    // 先尝试读取新格式（多提供商）
    const allKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (allKeys) {
      try {
        const keysObj = JSON.parse(allKeys);
        // 检查是否存在该提供商的 Key（包括空字符串）
        if (targetProvider in keysObj) {
          const key = keysObj[targetProvider];
          return key || ''; // 返回 Key，即使是空字符串
        }
      } catch (e) {
        console.warn('Failed to parse API keys:', e);
      }
    }
    
    // 向后兼容：如果是 deepseek 且新格式没有，尝试读取旧格式
    if (targetProvider === 'deepseek') {
      const oldKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (oldKey) {
        // 迁移到新格式
        saveApiKey('deepseek', oldKey);
        return oldKey;
      }
    }
    
    return '';
  } catch (e) {
    console.warn('Failed to read API key:', e);
    return '';
  }
};

/**
 * 保存 API Key（支持多提供商）
 * @param {string} provider - 提供商ID
 * @param {string} apiKey - API Key
 */
export const saveApiKey = (provider, apiKey) => {
  try {
    // 如果只传了一个参数，保持向后兼容（默认为当前提供商）
    // 使用参数检查而不是 arguments（ES6 模块中 arguments 不可用）
    if (apiKey === undefined) {
      apiKey = provider;
      provider = getCurrentProvider();
    }
    
    // 确保 apiKey 是字符串类型
    const keyValue = String(apiKey || '');
    
    // 读取现有的所有 Keys
    let allKeys = {};
    try {
      const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
      if (stored) {
        allKeys = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read existing API keys:', e);
      allKeys = {};
    }
    
    // 更新对应提供商的 Key（即使为空字符串也保存）
    allKeys[provider] = keyValue;
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(allKeys));
    
    // 如果是 deepseek，同时更新旧格式（向后兼容）
    if (provider === 'deepseek') {
      localStorage.setItem(API_KEY_STORAGE_KEY, keyValue);
    }
    
    console.log(`[AI Service] Saved API key for ${provider}:`, keyValue ? '***' + keyValue.slice(-4) : '(empty)');
  } catch (e) {
    console.error('Failed to save API key:', e);
  }
};

// ==================== 上下文记忆管理 ====================

/**
 * 获取对话历史
 * @param {string} contextId - 上下文ID（如题目ID）
 * @returns {Array} 对话历史数组
 */
export const getConversationHistory = (contextId) => {
  try {
    const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (stored) {
      const allHistory = JSON.parse(stored);
      return allHistory[contextId] || [];
    }
  } catch (e) {
    console.warn('Failed to read conversation history:', e);
  }
  return [];
};

/**
 * 保存对话历史
 * @param {string} contextId - 上下文ID
 * @param {Array} history - 对话历史数组
 */
export const saveConversationHistory = (contextId, history) => {
  try {
    const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    const allHistory = stored ? JSON.parse(stored) : {};
    // 限制历史长度
    allHistory[contextId] = history.slice(-MAX_HISTORY_LENGTH * 2);
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(allHistory));
  } catch (e) {
    console.error('Failed to save conversation history:', e);
  }
};

/**
 * 添加消息到对话历史
 * @param {string} contextId - 上下文ID
 * @param {string} role - 角色 (user/assistant)
 * @param {string} content - 消息内容
 */
export const addToConversationHistory = (contextId, role, content) => {
  const history = getConversationHistory(contextId);
  history.push({ role, content });
  saveConversationHistory(contextId, history);
};

/**
 * 清除对话历史
 * @param {string} contextId - 上下文ID，不传则清除所有
 */
export const clearConversationHistory = (contextId = null) => {
  try {
    if (contextId) {
      const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
      if (stored) {
        const allHistory = JSON.parse(stored);
        delete allHistory[contextId];
        localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(allHistory));
      }
    } else {
      localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to clear conversation history:', e);
  }
};

/**
 * 清除指定前缀的所有对话历史
 * 用于类似 `logic_${id}_${slotId}` 这种层级 contextId 的批量清理。
 * @param {string} prefix - 前缀（例如 `logic_${topicId}`）
 */
export const clearConversationHistoryByPrefix = (prefix) => {
  if (!prefix) return;

  try {
    const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!stored) return;

    const allHistory = JSON.parse(stored);
    let changed = false;

    for (const key of Object.keys(allHistory)) {
      if (key === prefix || key.startsWith(`${prefix}_`)) {
        delete allHistory[key];
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(allHistory));
    }
  } catch (e) {
    console.error('Failed to clear conversation history by prefix:', e);
  }
};

// ==================== 提供商 API 配置 ====================

/**
 * 验证 API Key 格式（确保只包含 ASCII 字符）
 * @param {string} apiKey - API Key
 * @returns {{valid: boolean, error?: string}} 验证结果
 */
const isValidApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API Key 不能为空' };
  }
  
  const trimmed = apiKey.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'API Key 不能为空' };
  }
  
  // 检查是否只包含 ASCII 字符（0-127），但允许常见的空白字符
  const invalidChars = [];
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code > 127) {
      invalidChars.push(`位置 ${i + 1}: '${trimmed[i]}' (Unicode ${code})`);
    }
  }
  
  if (invalidChars.length > 0) {
    return { 
      valid: false, 
      error: `API Key 包含非 ASCII 字符。请确保 API Key 只包含英文字母、数字和常见符号。\n问题字符: ${invalidChars.slice(0, 3).join(', ')}` 
    };
  }
  
  return { valid: true };
};

/**
 * 获取提供商的 API 端点 URL
 * @param {string} provider - 提供商ID
 * @returns {string} API URL
 */
const getProviderApiUrl = (provider) => {
  const urls = {
    'deepseek': 'https://api.deepseek.com/v1/chat/completions',
    // 豆包 API 端点 - 如果这个不正确，用户需要提供正确的端点
    // 可能的端点格式：
    // - https://ark.cn-beijing.volces.com/api/v3/chat/completions
    // - https://ark.volces.com/api/v3/chat/completions
    // - https://open.volcengine.com/api/v3/chat/completions
    'doubao': 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    'zhipu': 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  };
  return urls[provider] || urls[DEFAULT_PROVIDER];
};

/**
 * 获取提供商的错误提示信息
 * @param {string} provider - 提供商ID
 * @returns {string} 错误提示
 */
const getProviderErrorMsg = (provider) => {
  const messages = {
    'deepseek': '请先在设置中配置 DeepSeek API Key',
    'doubao': '请先在设置中配置豆包 API Key',
    'zhipu': '请先在设置中配置智谱AI API Key'
  };
  return messages[provider] || messages[DEFAULT_PROVIDER];
};

/**
 * 获取提供商的默认参数
 * @param {string} provider - 提供商ID
 * @returns {object} 默认参数对象
 */
const getProviderDefaultParams = (provider) => {
  if (provider === 'zhipu') {
    // GLM-4.6 默认参数
    const params = {
      temperature: 1.0,
      top_p: 0.95
    };
    // 根据配置决定是否启用深度思考
    const thinkingEnabled = getZhipuThinking();
    if (thinkingEnabled) {
      params.thinking = { type: 'enabled' };
    }
    return params;
  }
  // 其他提供商使用默认参数
  return {
    temperature: 0.7
  };
};

/**
 * 获取提供商的超时时间（毫秒）
 * @param {string} provider - 提供商ID
 * @returns {number} 超时时间（毫秒）
 */
const getProviderTimeout = (provider) => {
  if (provider === 'zhipu') {
    // 智谱AI深度思考功能需要更长时间，设置为90秒
    return 90000;
  }
  // 其他提供商使用默认30秒
  return 30000;
};

// ==================== 流式输出 ====================

/**
 * 流式调用AI服务
 * @param {string} prompt - 提示词
 * @param {object} options - 配置选项
 * @param {boolean} options.jsonMode - 是否使用JSON模式
 * @param {string} options.contextId - 上下文ID（用于多轮对话）
 * @param {boolean} options.useHistory - 是否使用对话历史
 * @param {function} options.onChunk - 收到数据块时的回调
 * @param {function} options.onComplete - 完成时的回调
 * @param {function} options.onError - 错误时的回调
 * @param {AbortSignal} options.signal - 取消信号
 * @returns {Promise<string>} 完整响应文本
 */
export const callAIStream = async (prompt, options = {}) => {
  const {
    jsonMode = false,
    contextId = null,
    useHistory = false,
    onChunk = () => {},
    onComplete = () => {},
    onError = () => {},
    signal = null
  } = options;

  const currentProvider = getCurrentProvider();
  const currentModel = getCurrentModel();
  
  // 检查使用限额
  const limitCheck = checkLimits();
  if (!limitCheck.allowed) {
    const errorMsg = `已达到使用限额: ${limitCheck.errors.join(', ')}`;
    onError(errorMsg);
    if (jsonMode) {
      return JSON.stringify({ error: errorMsg, status: 'limit_exceeded' });
    }
    throw new Error(errorMsg);
  }
  
  const API_KEY = getApiKey(currentProvider);
  if (!API_KEY) {
    const errorMsg = getProviderErrorMsg(currentProvider);
    onError(errorMsg);
    if (jsonMode) {
      return JSON.stringify({ error: errorMsg, status: 'error' });
    }
    throw new Error(errorMsg);
  }
  
  // 验证模型配置
  if (!currentModel) {
    const errorMsg = '请先在设置中选择模型';
    onError(errorMsg);
    if (jsonMode) {
      return JSON.stringify({ error: errorMsg, status: 'error' });
    }
    throw new Error(errorMsg);
  }
  
  const API_URL = getProviderApiUrl(currentProvider);
  
  console.log('[AI Service] Using model:', currentModel);
  
  // 构建消息
  const messages = [];
  
  // 添加系统提示
  if (jsonMode) {
    messages.push({
      role: 'system',
      content: 'You are a helpful assistant that responds in valid JSON format only.'
    });
  }
  
  // 添加对话历史（如果启用）
  if (useHistory && contextId) {
    const history = getConversationHistory(contextId);
    messages.push(...history);
  }
  
  // 添加当前用户消息
  messages.push({ role: 'user', content: prompt });

  // 获取提供商的默认参数
  const defaultParams = getProviderDefaultParams(currentProvider);

  const payload = {
    model: currentModel,
    messages: messages,
    ...defaultParams, // 使用提供商的默认参数
    stream: true, // 启用流式输出
    ...(jsonMode && { response_format: { type: 'json_object' } })
  };

  console.log('[AI Service] Stream Request:', { provider: currentProvider, model: currentModel, jsonMode, useHistory });
  
  try {
    // 验证 API Key 格式（确保不包含非 ASCII 字符）
    const trimmedKey = API_KEY ? String(API_KEY).trim() : '';
    const keyValidation = isValidApiKey(trimmedKey);
    if (!keyValidation.valid) {
      const errorMsg = keyValidation.error || 'API Key 格式无效，请确保只包含 ASCII 字符';
      onError(errorMsg);
      if (jsonMode) {
        return JSON.stringify({ error: errorMsg, status: 'error' });
      }
      throw new Error(errorMsg);
    }
    
    // 确保 Authorization header 只包含 ASCII 字符
    const authHeader = `Bearer ${trimmedKey}`;
    
    // 为流式请求创建超时控制器（如果没有传入signal）
    let timeoutController = null;
    let timeoutId = null;
    const finalSignal = signal || (() => {
      timeoutController = new AbortController();
      const timeout = getProviderTimeout(currentProvider);
      timeoutId = setTimeout(() => {
        timeoutController.abort();
      }, timeout);
      return timeoutController.signal;
    })();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload),
      signal: finalSignal
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || `HTTP error! status: ${response.status}` };
      }
      const errorMessage = errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`;
      onError(errorMessage);
      if (jsonMode) {
        return JSON.stringify({ error: errorMessage, status: 'error' });
      }
      throw new Error(errorMessage);
    }

    // 清除超时（如果设置了）
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let fullReasoningContent = ''; // GLM-4.6 思考过程内容
    let buffer = '';
    
    // 为流式读取设置超时（防止长时间无响应）
    const streamTimeout = getProviderTimeout(currentProvider);
    let lastChunkTime = Date.now();
    const streamTimeoutId = setInterval(() => {
      const now = Date.now();
      if (now - lastChunkTime > streamTimeout) {
        reader.cancel();
        clearInterval(streamTimeoutId);
        throw new Error('Stream timeout: 流式响应超时');
      }
    }, 5000); // 每5秒检查一次

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        clearInterval(streamTimeoutId);
        break;
      }
      
      lastChunkTime = Date.now(); // 更新最后接收数据的时间
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;
            
            // GLM-4.6 支持 reasoning_content（思考过程）和 content（回答内容）
            // 处理思考过程（如果存在）
            if (delta.reasoning_content) {
              fullReasoningContent += delta.reasoning_content;
              // 可选：将思考过程也传递给 onChunk（如果需要显示）
              // onChunk(`[思考] ${delta.reasoning_content}`, fullContent);
            }
            
            // 处理回答内容
            const content = delta.content || '';
            if (content) {
              fullContent += content;
              onChunk(content, fullContent);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    // 记录 token 使用量（估算）
    const estimatedInput = estimateTokens(prompt);
    const estimatedOutput = estimateTokens(fullContent);
    recordUsage(estimatedInput, estimatedOutput, currentModel);
    
    // 保存到对话历史
    if (useHistory && contextId) {
      addToConversationHistory(contextId, 'user', prompt);
      addToConversationHistory(contextId, 'assistant', fullContent);
    }
    
    onComplete(fullContent);
    console.log('[AI Service] Stream complete, length:', fullContent.length);
    return fullContent;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[AI Service] Stream aborted');
      return '';
    }
    
    // 使用增强的错误处理
    const errorDetails = getErrorDetails(error);
    logError(error, { type: 'stream', contextId, useHistory });
    
    console.error('[AI Service] Stream error:', {
      type: errorDetails.type,
      title: errorDetails.title,
      message: error.message
    });
    
    // 传递更详细的错误信息
    onError({
      message: errorDetails.suggestions[0],
      title: errorDetails.title,
      type: errorDetails.type,
      retryable: errorDetails.retryable,
      suggestions: errorDetails.suggestions,
      action: errorDetails.action
    });
    throw error;
  }
};

/**
 * 调用AI服务（非流式，保持向后兼容）
 * @param {string} prompt - 提示词
 * @param {boolean} jsonMode - 是否使用JSON模式
 * @param {string} provider - 提供商ID (可选)
 * @returns {Promise<string>} AI响应文本
 */
export const callAI = async (prompt, jsonMode = false, provider = null) => {
  const currentProvider = provider || getCurrentProvider();
  const currentModel = getCurrentModel();
  
  // 检查使用限额
  const limitCheck = checkLimits();
  if (!limitCheck.allowed) {
    const errorMsg = `已达到使用限额: ${limitCheck.errors.join(', ')}`;
    if (jsonMode) {
      return JSON.stringify({
        error: errorMsg,
        status: 'limit_exceeded',
        message: errorMsg
      });
    }
    throw new Error(errorMsg);
  }
  
  // 从配置中获取 API Key
  const API_KEY = getApiKey(currentProvider);
  if (!API_KEY) {
    const errorMsg = getProviderErrorMsg(currentProvider);
    if (jsonMode) {
      return JSON.stringify({
        error: errorMsg,
        status: 'error',
        message: errorMsg
      });
    }
    throw new Error(errorMsg);
  }
  
  // 验证模型配置
  if (!currentModel) {
    const errorMsg = '请先在设置中选择模型';
    if (jsonMode) {
      return JSON.stringify({
        error: errorMsg,
        status: 'error',
        message: errorMsg
      });
    }
    throw new Error(errorMsg);
  }
  
  const API_URL = getProviderApiUrl(currentProvider);
  
  console.log('[AI Service] Using model:', currentModel);
  
  // 构建消息
  const messages = [
    {
      role: 'user',
      content: prompt
    }
  ];

  // 如果启用 JSON 模式，添加系统提示
  if (jsonMode) {
    messages.unshift({
      role: 'system',
      content: 'You are a helpful assistant that responds in valid JSON format only.'
    });
  }

  // 获取提供商的默认参数
  const defaultParams = getProviderDefaultParams(currentProvider);

  const payload = {
    model: currentModel,
    messages: messages,
    ...defaultParams, // 使用提供商的默认参数
    ...(jsonMode && { response_format: { type: 'json_object' } })
  };

  console.log('[AI Service] Request:', {
    provider: currentProvider,
    url: API_URL,
    model: currentModel,
    jsonMode: jsonMode,
    payloadKeys: Object.keys(payload)
  });
  
  try {
    // 验证 API Key 格式（确保不包含非 ASCII 字符）
    const trimmedKey = API_KEY ? String(API_KEY).trim() : '';
    const keyValidation = isValidApiKey(trimmedKey);
    if (!keyValidation.valid) {
      const errorMsg = keyValidation.error || 'API Key 格式无效，请确保只包含 ASCII 字符';
      if (jsonMode) {
        return JSON.stringify({
          error: errorMsg,
          status: 'error',
          message: errorMsg
        });
      }
      throw new Error(errorMsg);
    }
    
    // 创建带超时的 fetch（根据提供商设置超时时间）
    const timeout = getProviderTimeout(currentProvider);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // 确保 Authorization header 只包含 ASCII 字符
    const authHeader = `Bearer ${trimmedKey}`;
    
    console.log('[AI Service] Sending request to:', API_URL);
    console.log('[AI Service] Request headers:', { 'Content-Type': 'application/json', 'Authorization': 'Bearer ***' });
    console.log('[AI Service] Request payload:', JSON.stringify(payload, null, 2));
    
    let response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      console.log('[AI Service] Fetch completed, status:', response.status, response.statusText);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[AI Service] Fetch error:', fetchError);
      throw fetchError;
    }
    
    clearTimeout(timeoutId);
    
    console.log('[AI Service] Response status:', response.status, response.statusText);
    console.log('[AI Service] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[AI Service] Error response text:', errorText);
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || `HTTP error! status: ${response.status}` };
      }
      console.error('[AI Service] Response error:', errorData);
      
      // 根据jsonMode返回相应格式的错误
      const errorMessage = errorData.error?.message || errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      if (jsonMode) {
        return JSON.stringify({
          error: errorMessage,
          status: 'error',
          message: errorMessage
        });
      }
      throw new Error(errorMessage);
    }

    let responseText;
    try {
      responseText = await response.text();
      console.log('[AI Service] Response text received, length:', responseText.length);
      if (responseText.length > 0) {
        console.log('[AI Service] Response text preview (first 200 chars):', responseText.substring(0, 200));
      } else {
        console.warn('[AI Service] Response text is empty!');
      }
    } catch (textError) {
      console.error('[AI Service] Failed to read response text:', textError);
      throw new Error('无法读取 API 响应');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[AI Service] Response data keys:', Object.keys(data));
      if (data.error) {
        console.error('[AI Service] API returned error:', data.error);
      }
    } catch (e) {
      console.error('[AI Service] Failed to parse response JSON:', e);
      console.error('[AI Service] Full response text:', responseText);
      throw new Error(`API 返回了无效的 JSON: ${e.message}`);
    }
    
    // 记录 token 使用量
    const usage = data.usage;
    if (usage) {
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      recordUsage(inputTokens, outputTokens, currentModel);
      console.log('[AI Service] Token usage recorded:', { inputTokens, outputTokens });
    } else {
      // 如果 API 没有返回 usage，使用估算值
      const estimatedInput = estimateTokens(prompt);
      const result = data.choices?.[0]?.message?.content || "";
      const estimatedOutput = estimateTokens(result);
      recordUsage(estimatedInput, estimatedOutput, currentModel);
      console.log('[AI Service] Token usage estimated:', { estimatedInput, estimatedOutput });
    }
    
    const result = data.choices?.[0]?.message?.content || "AI 暂时无法响应";
    console.log('[AI Service] Success, result length:', result.length);
    return result;
  } catch (error) {
    // 使用增强的错误处理服务
    const errorType = parseErrorType(error);
    const errorDetails = getErrorDetails(error);
    
    // 记录错误日志
    logError(error, {
      provider: currentProvider,
      model: currentModel,
      url: API_URL,
      jsonMode
    });
    
    console.error(`[AI Service] Error (${currentProvider}):`, {
      type: errorType,
      title: errorDetails.title,
      message: error.message,
      suggestions: errorDetails.suggestions
    });
    
    // 构建用户友好的错误消息
    const errorMessage = errorDetails.suggestions[0];
    
    // 如果jsonMode为true，返回JSON格式的错误消息（包含更多信息）
    if (jsonMode) {
      return JSON.stringify({
        error: errorMessage,
        errorType: errorType,
        status: 'error',
        message: errorMessage,
        title: errorDetails.title,
        suggestions: errorDetails.suggestions,
        retryable: errorDetails.retryable,
        action: errorDetails.action || null
      });
    }
    
    return errorMessage;
  }
};

/**
 * 带上下文的AI调用（支持多轮对话）
 * @param {string} prompt - 提示词
 * @param {string} contextId - 上下文ID
 * @param {object} options - 其他选项
 * @returns {Promise<string>} AI响应文本
 */
export const callAIWithContext = async (prompt, contextId, options = {}) => {
  const { jsonMode = false, stream = false, onChunk, onComplete, onError } = options;
  
  if (stream) {
    return callAIStream(prompt, {
      jsonMode,
      contextId,
      useHistory: true,
      onChunk,
      onComplete,
      onError
    });
  }
  
  // 非流式但带上下文
  const currentProvider = getCurrentProvider();
  const currentModel = getCurrentModel();
  const API_KEY = getApiKey(currentProvider);
  
  if (!API_KEY) {
    throw new Error(getProviderErrorMsg(currentProvider));
  }
  
  // 验证模型配置
  if (!currentModel) {
    throw new Error('请先在设置中选择模型');
  }
  
  const messages = [];
  if (jsonMode) {
    messages.push({
      role: 'system',
      content: 'You are a helpful assistant that responds in valid JSON format only.'
    });
  }
  
  // 添加历史对话
  const history = getConversationHistory(contextId);
  messages.push(...history);
  messages.push({ role: 'user', content: prompt });
  
  const API_URL = getProviderApiUrl(currentProvider);
  
  // 验证并清理 API Key
  const trimmedKey = API_KEY ? String(API_KEY).trim() : '';
  const keyValidation = isValidApiKey(trimmedKey);
  if (!keyValidation.valid) {
    throw new Error(keyValidation.error || 'API Key 格式无效，请确保只包含 ASCII 字符');
  }
  
  // 确保 Authorization header 只包含 ASCII 字符
  const authHeader = `Bearer ${trimmedKey}`;
  
  // 获取提供商的默认参数
  const defaultParams = getProviderDefaultParams(currentProvider);
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({
      model: currentModel,
      messages,
      ...defaultParams, // 使用提供商的默认参数
      ...(jsonMode && { response_format: { type: 'json_object' } })
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  const result = data.choices?.[0]?.message?.content || '';
  
  // 保存到历史
  addToConversationHistory(contextId, 'user', prompt);
  addToConversationHistory(contextId, 'assistant', result);
  
  return result;
};

/**
 * 使用模板调用 AI
 * @param {string} templateType - 模板类型 (logic/grammar/scoring/vocab)
 * @param {object} variables - 模板变量
 * @returns {Promise<string>} AI响应文本
 */
export const callAIWithTemplate = async (templateType, variables = {}) => {
  const prompt = buildPrompt(templateType, variables);
  if (!prompt) {
    throw new Error(`模板不存在: ${templateType}`);
  }
  return callAI(prompt, true);
};
