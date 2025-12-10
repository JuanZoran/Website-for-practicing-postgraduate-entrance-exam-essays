/**
 * AI服务抽象层
 * 支持多提供商切换: Gemini / DeepSeek / OpenAI
 */

const STORAGE_KEY = 'kaoyan_ai_provider';
const DEFAULT_PROVIDER = 'gemini';

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
  return defaultProvider?.defaultModel || 'gemini-2.5-flash-preview-09-2025';
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
  const apiUrl = '/api/ai';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        jsonMode,
        provider: currentProvider,
        model: currentModel,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.text || data.content || "AI 暂时无法响应";
  } catch (error) {
    console.error(`AI API Error (${currentProvider}):`, error);
    
    // 友好的错误提示
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return "网络错误，请检查连接";
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      return "API密钥无效，请检查配置";
    }
    
    if (error.message.includes('429')) {
      return "请求过于频繁，请稍后再试";
    }
    
    return `错误: ${error.message}`;
  }
};

