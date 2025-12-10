/**
 * AI服务抽象层
 * 支持 DeepSeek
 */

const STORAGE_KEY = 'kaoyan_ai_provider';
const API_KEY_STORAGE_KEY = 'kaoyan_deepseek_api_key';
const DEFAULT_PROVIDER = 'deepseek';

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
 * 获取 DeepSeek API Key
 */
export const getApiKey = () => {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch (e) {
    console.warn('Failed to read API key:', e);
    return '';
  }
};

/**
 * 保存 DeepSeek API Key
 */
export const saveApiKey = (apiKey) => {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (e) {
    console.error('Failed to save API key:', e);
  }
};

/**
 * 调用AI服务（直接调用 DeepSeek API）
 * @param {string} prompt - 提示词
 * @param {boolean} jsonMode - 是否使用JSON模式
 * @param {string} provider - 提供商ID (可选,默认使用保存的配置)
 * @returns {Promise<string>} AI响应文本
 */
export const callAI = async (prompt, jsonMode = false, provider = null) => {
  const currentProvider = provider || getCurrentProvider();
  const currentModel = getCurrentModel();
  
  // 从配置中获取 API Key
  const DEEPSEEK_API_KEY = getApiKey();
  if (!DEEPSEEK_API_KEY) {
    const errorMsg = '请先在设置中配置 DeepSeek API Key';
    if (jsonMode) {
      return JSON.stringify({
        error: errorMsg,
        status: 'error',
        message: errorMsg
      });
    }
    throw new Error(errorMsg);
  }
  
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
  
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

  const payload = {
    model: currentModel,
    messages: messages,
    temperature: 0.7,
    ...(jsonMode && { response_format: { type: 'json_object' } })
  };

  console.log('[AI Service] Request:', {
    url: DEEPSEEK_API_URL,
    model: currentModel,
    jsonMode: jsonMode
  });
  
  try {
    // 创建带超时的 fetch（30秒超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('[AI Service] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || `HTTP error! status: ${response.status}` };
      }
      console.error('[AI Service] Response error:', errorData);
      
      // 根据jsonMode返回相应格式的错误
      const errorMessage = errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`;
      if (jsonMode) {
        return JSON.stringify({
          error: errorMessage,
          status: 'error',
          message: errorMessage
        });
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[AI Service] Response data:', data);
    
    const result = data.choices?.[0]?.message?.content || "AI 暂时无法响应";
    console.log('[AI Service] Success, result length:', result.length);
    return result;
  } catch (error) {
    console.error(`[AI Service] Error (${currentProvider}):`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // 根据jsonMode返回相应格式的错误消息
    let errorMessage = '';
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      errorMessage = "请求超时，请稍后重试";
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = "网络错误，请检查网络连接";
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = "API密钥无效，请检查配置";
    } else if (error.message.includes('429')) {
      errorMessage = "请求过于频繁，请稍后再试";
    } else {
      errorMessage = `错误: ${error.message}`;
    }
    
    // 如果jsonMode为true，返回JSON格式的错误消息
    if (jsonMode) {
      return JSON.stringify({
        error: errorMessage,
        status: 'error',
        message: errorMessage
      });
    }
    
    return errorMessage;
  }
};