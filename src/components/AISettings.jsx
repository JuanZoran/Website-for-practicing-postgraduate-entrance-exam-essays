import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Sparkles, Key } from 'lucide-react';
import { getProviders, getCurrentProvider, getCurrentModel, saveProviderConfig, getApiKey, saveApiKey } from '../services/aiService';

const AISettings = ({ isOpen, onClose }) => {
  const [selectedModel, setSelectedModel] = useState(getCurrentModel());
  const [apiKey, setApiKey] = useState(getApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const providers = getProviders();
  const currentProvider = providers.find(p => p.id === getCurrentProvider());
  const models = currentProvider?.models || [];

  useEffect(() => {
    if (isOpen) {
      setSelectedModel(getCurrentModel());
      setApiKey(getApiKey());
      setShowApiKey(false);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const currentProviderId = getCurrentProvider();
    saveProviderConfig(currentProviderId, selectedModel);
    saveApiKey(apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-lg dark:text-white">AI 模型设置</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* AI提供商信息（只显示，不可选择） */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="text-sm font-bold text-indigo-800 dark:text-indigo-200 mb-1">
              AI 提供商
            </div>
            <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
              {currentProvider?.name || 'DeepSeek'}
            </div>
          </div>

          {/* API Key 配置 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                DeepSeek API Key
              </div>
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入 DeepSeek API Key (sk-...)"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm px-2 py-1"
                >
                  {showApiKey ? '隐藏' : '显示'}
                </button>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                获取 API Key: <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">platform.deepseek.com</a>
              </div>
              {!apiKey && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                  ⚠️ 未配置 API Key，AI 功能将无法使用
                </div>
              )}
            </div>
          </div>

          {/* 模型选择 */}
          {models.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                选择模型
              </label>
              <div className="space-y-2">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedModel === model.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedModel === model.id
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {selectedModel === model.id && (
                            <Check className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {model.name}
                        </span>
                      </div>
                      {selectedModel === model.id && (
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 当前配置提示 */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold">当前配置:</span>{' '}
              {currentProvider?.name} - {models.find(m => m.id === selectedModel)?.name}
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                已保存
              </>
            ) : (
              '保存设置'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
