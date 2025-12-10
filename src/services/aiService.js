/**
 * AI服务抽象层
 * 支持多提供商切换: Gemini / DeepSeek / OpenAI
 */

const STORAGE_KEY = 'kaoyan_ai_provider';
const DEFAULT_PROVIDER = 'deepseek';

/**
 * 获取所有可用的提供商列表
 */
export const getProviders = () => [
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-flash-preview-09-2025', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ],
    defaultModel: 'gemini-2.5-flash-preview-09-2025'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ],
    defaultModel: 'deepseek-chat'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    defaultModel: 'gpt-4o-mini'
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
 * 调用AI服务
 * @param {string} prompt - 提示词
 * @param {boolean} jsonMode - 是否使用JSON模式
 * @param {string} provider - 提供商ID (可选,默认使用保存的配置)
 * @returns {Promise<string>} AI响应文本
 */
export const callAI = async (prompt, jsonMode = false, provider = null) => {
  const currentProvider = provider || getCurrentProvider();
  const currentModel = getCurrentModel();
  
  // 使用后端API代理
  // 支持通过环境变量配置 Cloudflare Worker API 地址
  // 如果设置了 VITE_API_BASE_URL，则使用该地址（Cloudflare Worker）；否则使用相对路径（Vercel API）
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  // 临时 fallback：如果环境变量未设置，使用硬编码的 Cloudflare Worker 地址
  // TODO: 部署后应该通过环境变量配置，这里作为临时方案
  const fallbackWorkerUrl = 'https://ai-api.huangzirui030927.workers.dev';
  const finalApiBaseUrl = apiBaseUrl || fallbackWorkerUrl;
  
  // Cloudflare Worker 直接处理根路径，不需要 /api/ai
  // Vercel API 需要 /api/ai 路径
  const apiUrl = finalApiBaseUrl;
  
  // 调试信息
  console.log('[AI Service] Environment:', {
    'VITE_API_BASE_URL (env)': import.meta.env.VITE_API_BASE_URL || '(not set)',
    'apiBaseUrl (parsed)': apiBaseUrl || '(empty)',
    'fallbackWorkerUrl': fallbackWorkerUrl,
    'finalApiBaseUrl': finalApiBaseUrl,
    'apiUrl (final)': apiUrl
  });
  
  try {
    const requestBody = {
      prompt,
      jsonMode,
      provider: currentProvider,
      model: currentModel,
    };
    
    console.log('[AI Service] Request:', {
      url: apiUrl,
      method: 'POST',
      body: requestBody
    });
    
    // 创建带超时的 fetch（30秒超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('[AI Service] Response text:', responseText.substring(0, 200));
    
    // 检查响应是否为纯文本错误消息（非JSON格式）
    if (responseText.includes('请求超时') || responseText.includes('网络错误') || responseText.includes('错误')) {
      // 如果是错误消息且不是JSON格式，根据jsonMode返回相应格式
      if (jsonMode) {
        return JSON.stringify({
          error: responseText,
          status: 'error',
          message: responseText
        });
      }
      return responseText;
    }
    
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[AI Service] JSON parse error:', e, 'Response:', responseText);
      // 如果jsonMode为true，返回JSON格式的错误
      if (jsonMode) {
        return JSON.stringify({
          error: '服务器返回了无效的JSON格式',
          status: 'error',
          message: '服务器返回了无效的JSON格式',
          rawResponse: responseText.substring(0, 100)
        });
      }
      throw new Error('服务器返回了无效的JSON格式');
    }
    
    if (data.error) {
      console.error('[AI Service] API returned error:', data.error);
      // 如果jsonMode为true，确保返回JSON格式
      if (jsonMode) {
        return JSON.stringify({
          error: data.error,
          status: 'error',
          message: data.error
        });
      }
      throw new Error(data.error);
    }

    const result = data.text || data.content || "AI 暂时无法响应";
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
      errorMessage = "网络错误，请检查连接或 Cloudflare Worker 是否正常运行";
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = "API密钥无效，请检查 Cloudflare Worker 配置";
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

