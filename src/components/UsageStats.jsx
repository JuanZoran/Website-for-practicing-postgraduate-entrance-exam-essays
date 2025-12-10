import { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Zap, Calendar, AlertTriangle, Settings, BarChart3, RefreshCw } from 'lucide-react';
import {
  getUsageData,
  getLimits,
  saveLimits,
  getTodayUsage,
  getMonthUsage,
  getUsageTrend,
  formatTokens,
  clearUsageData
} from '../services/usageService';

const UsageStats = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [limits, setLimits] = useState(getLimits());
  const [todayUsage, setTodayUsage] = useState(getTodayUsage());
  const [monthUsage, setMonthUsage] = useState(getMonthUsage());
  const [trend, setTrend] = useState(getUsageTrend(7));
  const [totalUsage, setTotalUsage] = useState({ input: 0, output: 0, requests: 0, cost: 0 });

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    setTodayUsage(getTodayUsage());
    setMonthUsage(getMonthUsage());
    setTrend(getUsageTrend(7));
    setLimits(getLimits());
    const data = getUsageData();
    setTotalUsage(data.total);
  };

  const handleSaveLimits = () => {
    saveLimits(limits);
    alert('限额设置已保存');
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有使用统计数据吗？此操作不可恢复。')) {
      clearUsageData();
      refreshData();
    }
  };

  const getProgressColor = (current, limit) => {
    const ratio = current / limit;
    if (ratio >= 0.9) return 'bg-red-500';
    if (ratio >= 0.7) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const maxTrendTokens = Math.max(...trend.map(t => t.totalTokens), 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-xl w-full max-w-lg md:max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-lg dark:text-white">使用统计</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={refreshData}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex px-4 py-2 gap-2 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'overview' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            概览
          </button>
          <button 
            onClick={() => setActiveTab('trend')} 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'trend' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            趋势
          </button>
          <button 
            onClick={() => setActiveTab('limits')} 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'limits' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            限额
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 今日统计 */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">今日使用</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatTokens(todayUsage.input + todayUsage.output)}
                    </div>
                    <div className="text-xs text-slate-500">Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {todayUsage.requests}
                    </div>
                    <div className="text-xs text-slate-500">请求次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${todayUsage.cost.toFixed(4)}
                    </div>
                    <div className="text-xs text-slate-500">成本</div>
                  </div>
                </div>
                {limits.enabled && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>今日限额</span>
                      <span>{formatTokens(todayUsage.input + todayUsage.output)} / {formatTokens(limits.dailyTokens)}</span>
                    </div>
                    <div className="h-2 bg-white/50 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(todayUsage.input + todayUsage.output, limits.dailyTokens)} transition-all`}
                        style={{ width: `${Math.min(100, ((todayUsage.input + todayUsage.output) / limits.dailyTokens) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 本月统计 */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">本月使用</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {formatTokens(monthUsage.input + monthUsage.output)}
                    </div>
                    <div className="text-xs text-slate-500">Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {monthUsage.requests}
                    </div>
                    <div className="text-xs text-slate-500">请求次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${monthUsage.cost.toFixed(4)}
                    </div>
                    <div className="text-xs text-slate-500">成本</div>
                  </div>
                </div>
                {limits.enabled && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>月度限额</span>
                      <span>{formatTokens(monthUsage.input + monthUsage.output)} / {formatTokens(limits.monthlyTokens)}</span>
                    </div>
                    <div className="h-2 bg-white/50 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(monthUsage.input + monthUsage.output, limits.monthlyTokens)} transition-all`}
                        style={{ width: `${Math.min(100, ((monthUsage.input + monthUsage.output) / limits.monthlyTokens) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 累计统计 */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">累计使用</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">输入 Tokens</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatTokens(totalUsage.input)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">输出 Tokens</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatTokens(totalUsage.output)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">总请求数</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{totalUsage.requests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">总成本</span>
                    <span className="font-medium text-green-600 dark:text-green-400">${totalUsage.cost.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trend' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-sm text-slate-500 mb-2">最近 7 天使用趋势</div>
              
              {/* 简易柱状图 */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                <div className="flex items-end justify-between h-40 gap-2">
                  {trend.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs text-slate-400">{formatTokens(day.totalTokens)}</div>
                      <div 
                        className="w-full bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                        style={{ 
                          height: `${Math.max(4, (day.totalTokens / maxTrendTokens) * 100)}%`,
                          minHeight: '4px'
                        }}
                      />
                      <div className="text-xs text-slate-500">{day.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 详细数据表格 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500 font-medium">日期</th>
                      <th className="px-3 py-2 text-right text-slate-500 font-medium">Tokens</th>
                      <th className="px-3 py-2 text-right text-slate-500 font-medium">请求</th>
                      <th className="px-3 py-2 text-right text-slate-500 font-medium">成本</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trend.slice().reverse().map((day, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{day.date}</td>
                        <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{formatTokens(day.totalTokens)}</td>
                        <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{day.requests}</td>
                        <td className="px-3 py-2 text-right text-green-600 dark:text-green-400">${day.cost.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 启用限额开关 */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="font-medium text-slate-700 dark:text-slate-300">启用使用限额</div>
                    <div className="text-xs text-slate-500">超出限额时将阻止 AI 调用</div>
                  </div>
                </div>
                <button
                  onClick={() => setLimits({ ...limits, enabled: !limits.enabled })}
                  className={`w-12 h-7 rounded-full transition-colors ${limits.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'} relative`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${limits.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* 限额设置 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    每日 Token 限额
                  </label>
                  <input
                    type="number"
                    value={limits.dailyTokens}
                    onChange={(e) => setLimits({ ...limits, dailyTokens: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="100000"
                  />
                  <div className="text-xs text-slate-500 mt-1">当前: {formatTokens(limits.dailyTokens)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    每月 Token 限额
                  </label>
                  <input
                    type="number"
                    value={limits.monthlyTokens}
                    onChange={(e) => setLimits({ ...limits, monthlyTokens: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="2000000"
                  />
                  <div className="text-xs text-slate-500 mt-1">当前: {formatTokens(limits.monthlyTokens)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    每日成本限额 (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={limits.dailyCost}
                    onChange={(e) => setLimits({ ...limits, dailyCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="1.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    每月成本限额 (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={limits.monthlyCost}
                    onChange={(e) => setLimits({ ...limits, monthlyCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="10.00"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClearData}
                  className="flex-1 py-2.5 px-4 text-red-600 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                >
                  清除数据
                </button>
                <button
                  onClick={handleSaveLimits}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  保存设置
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageStats;
