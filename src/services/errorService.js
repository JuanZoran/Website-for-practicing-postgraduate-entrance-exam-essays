/**
 * 错误处理服务
 * 提供详细的错误分类、用户友好提示和恢复建议
 */

// 错误类型枚举
export const ERROR_TYPES = {
  NETWORK: 'network',
  API_KEY: 'api_key',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout',
  PARSE: 'parse',
  VALIDATION: 'validation',
  STORAGE: 'storage',
  AUTH: 'auth',
  UNKNOWN: 'unknown'
};

// 错误严重程度
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * 错误信息配置
 */
const ERROR_CONFIG = {
  [ERROR_TYPES.NETWORK]: {
    title: '网络连接问题',
    icon: '🌐',
    severity: ERROR_SEVERITY.ERROR,
    suggestions: [
      '检查网络连接是否正常',
      '尝试刷新页面重试',
      '如使用VPN，尝试切换节点'
    ],
    retryable: true
  },
  [ERROR_TYPES.API_KEY]: {
    title: 'API密钥问题',
    icon: '🔑',
    severity: ERROR_SEVERITY.ERROR,
    suggestions: [
      '检查API Key是否正确配置',
      '确认API Key未过期或被禁用',
      '前往设置页面重新配置'
    ],
    retryable: false,
    action: { label: '前往设置', type: 'settings' }
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    title: '请求频率限制',
    icon: '⏱️',
    severity: ERROR_SEVERITY.WARNING,
    suggestions: [
      '请求过于频繁，请稍后再试',
      '建议等待1-2分钟后重试',
      '考虑升级API套餐获取更高限额'
    ],
    retryable: true,
    retryDelay: 60000
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: '请求超时',
    icon: '⏰',
    severity: ERROR_SEVERITY.WARNING,
    suggestions: [
      'AI正在思考中，请耐心等待',
      '网络较慢时可能需要更长时间',
      '尝试简化输入内容后重试'
    ],
    retryable: true
  },
  [ERROR_TYPES.PARSE]: {
    title: '数据解析错误',
    icon: '📄',
    severity: ERROR_SEVERITY.ERROR,
    suggestions: [
      'AI返回的数据格式异常',
      '请重新提交尝试',
      '如持续出现请反馈给开发者'
    ],
    retryable: true
  },
  [ERROR_TYPES.VALIDATION]: {
    title: '输入验证失败',
    icon: '✏️',
    severity: ERROR_SEVERITY.INFO,
    suggestions: [
      '请检查输入内容是否完整',
      '确保输入不包含特殊字符',
      '输入长度需在合理范围内'
    ],
    retryable: false
  },
  [ERROR_TYPES.STORAGE]: {
    title: '存储空间问题',
    icon: '💾',
    severity: ERROR_SEVERITY.WARNING,
    suggestions: [
      '浏览器存储空间可能已满',
      '尝试清理浏览器缓存',
      '导出数据后清理历史记录'
    ],
    retryable: false,
    action: { label: '清理缓存', type: 'clearCache' }
  },
  [ERROR_TYPES.AUTH]: {
    title: '认证失败',
    icon: '🔒',
    severity: ERROR_SEVERITY.ERROR,
    suggestions: [
      '登录状态可能已过期',
      '请重新登录后再试',
      '检查账号是否正常'
    ],
    retryable: false,
    action: { label: '重新登录', type: 'login' }
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: '未知错误',
    icon: '❓',
    severity: ERROR_SEVERITY.ERROR,
    suggestions: [
      '发生了意外错误',
      '请刷新页面后重试',
      '如问题持续请联系支持'
    ],
    retryable: true
  }
};

/**
 * 解析错误类型
 */
export const parseErrorType = (error) => {
  const message = (error?.message || error || '').toLowerCase();
  
  // 网络错误
  if (message.includes('failed to fetch') || 
      message.includes('network') || 
      message.includes('cors') ||
      message.includes('net::')) {
    return ERROR_TYPES.NETWORK;
  }
  
  // API Key 错误
  if (message.includes('401') || 
      message.includes('403') || 
      message.includes('api key') ||
      message.includes('unauthorized') ||
      message.includes('invalid key')) {
    return ERROR_TYPES.API_KEY;
  }
  
  // 频率限制
  if (message.includes('429') || 
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('频繁')) {
    return ERROR_TYPES.RATE_LIMIT;
  }
  
  // 超时
  if (message.includes('timeout') || 
      message.includes('abort') ||
      message.includes('超时')) {
    return ERROR_TYPES.TIMEOUT;
  }
  
  // 解析错误
  if (message.includes('json') || 
      message.includes('parse') ||
      message.includes('syntax')) {
    return ERROR_TYPES.PARSE;
  }
  
  // 存储错误
  if (message.includes('quota') || 
      message.includes('storage') ||
      message.includes('localstorage')) {
    return ERROR_TYPES.STORAGE;
  }
  
  // 认证错误
  if (message.includes('auth') || 
      message.includes('login') ||
      message.includes('session')) {
    return ERROR_TYPES.AUTH;
  }
  
  return ERROR_TYPES.UNKNOWN;
};

/**
 * 获取错误详情
 */
export const getErrorDetails = (error) => {
  const type = parseErrorType(error);
  const config = ERROR_CONFIG[type];
  const originalMessage = error?.message || error || '未知错误';
  
  return {
    type,
    ...config,
    originalMessage,
    timestamp: Date.now()
  };
};

/**
 * 格式化用户友好的错误消息
 */
export const formatErrorMessage = (error) => {
  const details = getErrorDetails(error);
  return {
    title: details.title,
    message: details.suggestions[0],
    icon: details.icon,
    severity: details.severity
  };
};

/**
 * 错误日志记录
 */
const ERROR_LOG_KEY = 'kaoyan_error_log';
const MAX_ERROR_LOGS = 50;

export const logError = (error, context = {}) => {
  try {
    const logs = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    const errorDetails = getErrorDetails(error);
    
    logs.unshift({
      ...errorDetails,
      context,
      timestamp: Date.now()
    });
    
    // 只保留最近的错误
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs.slice(0, MAX_ERROR_LOGS)));
  } catch (e) {
    console.warn('Failed to log error:', e);
  }
};

export const getErrorLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
  } catch {
    return [];
  }
};

export const clearErrorLogs = () => {
  localStorage.removeItem(ERROR_LOG_KEY);
};

/**
 * 重试管理器
 */
export class RetryManager {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.retryCount = 0;
  }
  
  async execute(fn, onRetry) {
    while (this.retryCount < this.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        this.retryCount++;
        const errorDetails = getErrorDetails(error);
        
        if (!errorDetails.retryable || this.retryCount >= this.maxRetries) {
          throw error;
        }
        
        const delay = errorDetails.retryDelay || this.baseDelay * Math.pow(2, this.retryCount - 1);
        
        if (onRetry) {
          onRetry(this.retryCount, this.maxRetries, delay);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  reset() {
    this.retryCount = 0;
  }
}
