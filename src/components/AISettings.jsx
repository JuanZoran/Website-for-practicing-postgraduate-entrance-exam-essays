import React, { useState, useEffect } from 'react';
import { X, Settings, Check, BrainCircuit, Sparkles } from 'lucide-react';
import { getProviders, getCurrentProvider, getCurrentModel, saveProviderConfig } from '../services/aiService';

const AISettings = ({ isOpen, onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState(getCurrentProvider());
  const [selectedModel, setSelectedModel] = useState(getCurrentModel());
  const [saved, setSaved] = useState(false);

  const providers = getProviders();
  const currentProviderData = providers.find(p => p.id === selectedProvider);

  useEffect(() => {
    if (isOpen) {
      setSelectedProvider(getCurrentProvider());
      setSelectedModel(getCurrentModel());
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveProviderConfig(selectedProvider, selectedModel);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleProviderChange = (providerId) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setSelectedModel(provider.defaultModel);
    }
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
            <h3 className="font-bold text-lg dark:text-white">AI 提供商设置</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 提供商选择 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              选择 AI 提供商
            </label>
            <div className="space-y-2">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                  onClick={() => handleProviderChange(provider.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedProvider === provider.id
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {selectedProvider === provider.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {provider.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {provider.models.length} 个模型可用
                        </div>
                      </div>
                    </div>
                    {selectedProvider === provider.id && (
                      <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 模型选择 */}
          {currentProviderData && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                选择模型
              </label>
              <div className="space-y-2">
                {currentProviderData.models.map((model) => (
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
              {currentProviderData?.name} - {currentProviderData?.models.find(m => m.id === selectedModel)?.name}
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

