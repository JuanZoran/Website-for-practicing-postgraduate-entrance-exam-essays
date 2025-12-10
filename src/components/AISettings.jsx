import { useState, useEffect, useRef } from 'react';
import { X, Settings, Check, Sparkles, Key, BarChart3, FileText, ChevronRight } from 'lucide-react';
import { getProviders, getCurrentProvider, getCurrentModel, saveProviderConfig, getApiKey, saveApiKey, getZhipuThinking, saveZhipuThinking } from '../services/aiService';
import { getTodayUsage, formatTokens } from '../services/usageService';
import UsageStats from './UsageStats';
import PromptManager from './PromptManager';

const AISettings = ({ isOpen, onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState(getCurrentProvider());
  const [selectedModel, setSelectedModel] = useState(getCurrentModel());
  const [apiKey, setApiKey] = useState(getApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [zhipuThinking, setZhipuThinking] = useState(getZhipuThinking());
  const [saved, setSaved] = useState(false);
  const [showUsageStats, setShowUsageStats] = useState(false);
  const [showPromptManager, setShowPromptManager] = useState(false);
  const [todayUsage, setTodayUsage] = useState({ input: 0, output: 0, requests: 0, cost: 0 });
  
  // 使用 ref 跟踪上一次的提供商，避免在用户输入时重置 API Key
  const prevProviderRef = useRef(null);

  const providers = getProviders();
  const currentProviderObj = providers.find(p => p.id === selectedProvider);
  const models = currentProviderObj?.models || [];

  useEffect(() => {
    if (isOpen) {
      const provider = getCurrentProvider();
      setSelectedProvider(provider);
      setSelectedModel(getCurrentModel());
      // 读取当前提供商的 API Key
      const providerKey = getApiKey(provider);
      setApiKey(providerKey);
      setZhipuThinking(getZhipuThinking());
      setShowApiKey(false);
      setSaved(false);
      setTodayUsage(getTodayUsage());
      prevProviderRef.current = provider;
    }
  }, [isOpen]);

  // 当切换提供商时，更新 API Key 和模型
  useEffect(() => {
    if (isOpen && prevProviderRef.current !== selectedProvider) {
      // 只在真正切换提供商时才读取 API Key
      const providerKey = getApiKey(selectedProvider);
      setApiKey(providerKey);
      prevProviderRef.current = selectedProvider;
      
      const providerObj = providers.find(p => p.id === selectedProvider);
      if (providerObj) {
        // 如果当前模型不属于新提供商，切换到默认模型
        const hasModel = providerObj.models.some(m => m.id === selectedModel);
        if (!hasModel) {
          setSelectedModel(providerObj.defaultModel);
        }
      }
    }
    // 注意：不包含 providers 在依赖项中，因为它是常量
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, isOpen]);

  const handleSave = () => {
    saveProviderConfig(selectedProvider, selectedModel);
    saveApiKey(selectedProvider, apiKey);
    if (selectedProvider === 'zhipu') {
      saveZhipuThinking(zhipuThinking);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const getApiKeyPlaceholder = (providerId) => {
    const placeholders = {
      'deepseek': '请输入 DeepSeek API Key (sk-...)',
      'doubao': '请输入豆包 API Key',
      'zhipu': '请输入智谱AI API Key'
    };
    return placeholders[providerId] || '请输入 API Key';
  };

  const getApiKeyHelpUrl = (providerId) => {
    const urls = {
      'deepseek': { url: 'https://platform.deepseek.com/api_keys', text: 'platform.deepseek.com' },
      'doubao': { url: 'https://www.volcengine.com/product/doubao', text: '火山引擎豆包' },
      'zhipu': { url: 'https://open.bigmodel.cn/usercenter/apikeys', text: '智谱AI开放平台' }
    };
    return urls[providerId] || urls['deepseek'];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-xl p-6 w-full max-w-md md:max-w-md h-[90vh] md:h-auto shadow-2xl flex flex-col md:flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-lg dark:text-white">AI 模型设置</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* AI提供商选择 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              AI 提供商
            </label>
            <div className="space-y-2">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedProvider === provider.id
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {selectedProvider === provider.id && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {provider.name}
                      </span>
                    </div>
                    {selectedProvider === provider.id && (
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key 配置 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {currentProviderObj?.name || 'API'} Key
              </div>
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={getApiKeyPlaceholder(selectedProvider)}
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
                获取 API Key: <a href={getApiKeyHelpUrl(selectedProvider).url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{getApiKeyHelpUrl(selectedProvider).text}</a>
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
              {selectedProvider === 'doubao' && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  💡 提示：如果遇到"模型不存在"错误，请确认已在<a href="https://console.volcengine.com/ark" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">火山引擎控制台</a>开通对应模型服务
                </div>
              )}
            </div>
          )}

          {/* 智谱AI深度思考开关 */}
          {selectedProvider === 'zhipu' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                深度思考功能
              </label>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                      启用深度思考
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      适用于复杂推理和编码任务，启用后响应时间可能更长
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setZhipuThinking(!zhipuThinking)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      zhipuThinking
                        ? 'bg-indigo-600'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        zhipuThinking ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 使用统计入口 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              高级功能
            </label>
            <div className="space-y-2">
              {/* 使用统计 */}
              <button
                onClick={() => setShowUsageStats(true)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-800 dark:text-slate-200">使用统计</div>
                    <div className="text-xs text-slate-500">
                      今日: {formatTokens(todayUsage.input + todayUsage.output)} tokens · ${todayUsage.cost.toFixed(4)}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>

              {/* 提示词管理 */}
              <button
                onClick={() => setShowPromptManager(true)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-800 dark:text-slate-200">提示词管理</div>
                    <div className="text-xs text-slate-500">自定义审题、润色、评分模板</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
              </button>
            </div>
          </div>

          {/* 当前配置提示 */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold">当前配置:</span>{' '}
              {currentProviderObj?.name} - {models.find(m => m.id === selectedModel)?.name}
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="mt-6 flex gap-3 flex-shrink-0">
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

      {/* 使用统计弹窗 */}
      <UsageStats isOpen={showUsageStats} onClose={() => setShowUsageStats(false)} />
      
      {/* 提示词管理弹窗 */}
      <PromptManager isOpen={showPromptManager} onClose={() => setShowPromptManager(false)} />
    </div>
  );
};

export default AISettings;
