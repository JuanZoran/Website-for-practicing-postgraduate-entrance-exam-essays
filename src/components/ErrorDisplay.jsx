/**
 * 错误显示组件
 * 提供用户友好的错误提示和恢复建议
 */

import { useEffect, useState } from 'react';
import { 
  AlertCircle, RefreshCw, Settings, LogIn, Trash2, 
  ChevronDown, ChevronUp, X, Copy, Check
} from 'lucide-react';
import { getErrorDetails, ERROR_SEVERITY } from '../services/errorService';

/**
 * 错误提示Toast组件
 */
export const ErrorToast = ({ error, onClose, onRetry, onAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const details = getErrorDetails(error);

  const severityStyles = {
    [ERROR_SEVERITY.INFO]: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    [ERROR_SEVERITY.WARNING]: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    [ERROR_SEVERITY.ERROR]: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    [ERROR_SEVERITY.CRITICAL]: 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700'
  };

  const severityTextStyles = {
    [ERROR_SEVERITY.INFO]: 'text-blue-800 dark:text-blue-200',
    [ERROR_SEVERITY.WARNING]: 'text-amber-800 dark:text-amber-200',
    [ERROR_SEVERITY.ERROR]: 'text-red-800 dark:text-red-200',
    [ERROR_SEVERITY.CRITICAL]: 'text-red-900 dark:text-red-100'
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(details.originalMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleAction = () => {
    if (details.action && onAction) {
      onAction(details.action.type);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 ${severityStyles[details.severity]} animate-slideUp`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{details.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`font-semibold ${severityTextStyles[details.severity]}`}>
              {details.title}
            </h4>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <p className={`text-sm mt-1 ${severityTextStyles[details.severity]} opacity-80`}>
            {details.suggestions[0]}
          </p>
        </div>
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3">
          {/* 建议列表 */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">💡 恢复建议</p>
            <ul className="space-y-1.5">
              {details.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400 mt-0.5">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* 原始错误信息 */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">🔍 错误详情</p>
            <div className="flex items-start gap-2">
              <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400 break-all">
                {details.originalMessage}
              </code>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                title="复制错误信息"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 mt-4">
        {details.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        )}
        
        {details.action && (
          <button
            onClick={handleAction}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            {details.action.type === 'settings' && <Settings className="w-4 h-4" />}
            {details.action.type === 'login' && <LogIn className="w-4 h-4" />}
            {details.action.type === 'clearCache' && <Trash2 className="w-4 h-4" />}
            {details.action.label}
          </button>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * 内联错误提示组件（轻量级）
 */
export const InlineError = ({ error, onRetry }) => {
  const details = getErrorDetails(error);

  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm">
      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <span className="text-red-700 dark:text-red-300 flex-1">{details.suggestions[0]}</span>
      {details.retryable && onRetry && (
        <button
          onClick={onRetry}
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重试
        </button>
      )}
    </div>
  );
};

/**
 * 重试状态提示
 */
export const RetryIndicator = ({ currentRetry, maxRetries, delay }) => {
  const [countdown, setCountdown] = useState(Math.ceil(delay / 1000));

  useEffect(() => {
    setCountdown(Math.ceil(delay / 1000));
    const timer = window.setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [delay]);

  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
      <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          正在重试 ({currentRetry}/{maxRetries})
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {countdown > 0 ? `${countdown}秒后重试...` : '重试中...'}
        </p>
      </div>
    </div>
  );
};

/**
 * 全局错误边界的Fallback组件
 */
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const details = getErrorDetails(error);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 text-center">
        <div className="text-6xl mb-4">{details.icon}</div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          {details.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {details.suggestions[0]}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            重新加载
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            刷新页面
          </button>
        </div>

        <details className="mt-6 text-left">
          <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-600">
            查看错误详情
          </summary>
          <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs text-slate-600 dark:text-slate-400 overflow-auto max-h-32">
            {details.originalMessage}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ErrorToast;
