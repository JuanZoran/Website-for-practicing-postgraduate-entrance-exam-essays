/**
 * Token 使用量统计与成本控制服务
 */

const USAGE_STORAGE_KEY = 'kaoyan_ai_usage';
const LIMITS_STORAGE_KEY = 'kaoyan_ai_limits';

// DeepSeek 定价 (每百万 token)
const PRICING = {
  'deepseek-chat': {
    input: 0.14,   // $0.14/M input tokens
    output: 0.28,  // $0.28/M output tokens
    cached: 0.014  // $0.014/M cached tokens
  }
};

/**
 * 获取使用量数据
 */
export const getUsageData = () => {
  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to read usage data:', e);
  }
  return {
    daily: {},      // { '2024-01-01': { input: 0, output: 0, requests: 0, cost: 0 } }
    monthly: {},    // { '2024-01': { input: 0, output: 0, requests: 0, cost: 0 } }
    total: { input: 0, output: 0, requests: 0, cost: 0 }
  };
};

/**
 * 保存使用量数据
 */
const saveUsageData = (data) => {
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save usage data:', e);
  }
};

/**
 * 获取限额配置
 */
export const getLimits = () => {
  try {
    const stored = localStorage.getItem(LIMITS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to read limits:', e);
  }
  return {
    dailyTokens: 100000,     // 每日 token 限额 (默认 10万)
    monthlyTokens: 2000000,  // 每月 token 限额 (默认 200万)
    dailyCost: 1.0,          // 每日成本限额 (美元)
    monthlyCost: 10.0,       // 每月成本限额 (美元)
    enabled: false           // 是否启用限额
  };
};

/**
 * 保存限额配置
 */
export const saveLimits = (limits) => {
  try {
    localStorage.setItem(LIMITS_STORAGE_KEY, JSON.stringify(limits));
  } catch (e) {
    console.error('Failed to save limits:', e);
  }
};

/**
 * 计算成本
 */
export const calculateCost = (inputTokens, outputTokens, model = 'deepseek-chat') => {
  const pricing = PRICING[model] || PRICING['deepseek-chat'];
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return inputCost + outputCost;
};

/**
 * 记录一次 API 调用的使用量
 */
export const recordUsage = (inputTokens, outputTokens, model = 'deepseek-chat') => {
  const data = getUsageData();
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];  // '2024-01-01'
  const monthKey = dateKey.substring(0, 7);          // '2024-01'
  
  const cost = calculateCost(inputTokens, outputTokens, model);
  const totalTokens = inputTokens + outputTokens;
  
  // 更新每日统计
  if (!data.daily[dateKey]) {
    data.daily[dateKey] = { input: 0, output: 0, requests: 0, cost: 0 };
  }
  data.daily[dateKey].input += inputTokens;
  data.daily[dateKey].output += outputTokens;
  data.daily[dateKey].requests += 1;
  data.daily[dateKey].cost += cost;
  
  // 更新每月统计
  if (!data.monthly[monthKey]) {
    data.monthly[monthKey] = { input: 0, output: 0, requests: 0, cost: 0 };
  }
  data.monthly[monthKey].input += inputTokens;
  data.monthly[monthKey].output += outputTokens;
  data.monthly[monthKey].requests += 1;
  data.monthly[monthKey].cost += cost;
  
  // 更新总计
  data.total.input += inputTokens;
  data.total.output += outputTokens;
  data.total.requests += 1;
  data.total.cost += cost;
  
  saveUsageData(data);
  
  return { inputTokens, outputTokens, totalTokens, cost };
};

/**
 * 检查是否超出限额
 */
export const checkLimits = () => {
  const limits = getLimits();
  if (!limits.enabled) {
    return { allowed: true };
  }
  
  const data = getUsageData();
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];
  const monthKey = dateKey.substring(0, 7);
  
  const dailyUsage = data.daily[dateKey] || { input: 0, output: 0, cost: 0 };
  const monthlyUsage = data.monthly[monthKey] || { input: 0, output: 0, cost: 0 };
  
  const dailyTokens = dailyUsage.input + dailyUsage.output;
  const monthlyTokens = monthlyUsage.input + monthlyUsage.output;
  
  const errors = [];
  
  if (dailyTokens >= limits.dailyTokens) {
    errors.push(`已达到每日 Token 限额 (${formatTokens(limits.dailyTokens)})`);
  }
  if (monthlyTokens >= limits.monthlyTokens) {
    errors.push(`已达到每月 Token 限额 (${formatTokens(limits.monthlyTokens)})`);
  }
  if (dailyUsage.cost >= limits.dailyCost) {
    errors.push(`已达到每日成本限额 ($${limits.dailyCost.toFixed(2)})`);
  }
  if (monthlyUsage.cost >= limits.monthlyCost) {
    errors.push(`已达到每月成本限额 ($${limits.monthlyCost.toFixed(2)})`);
  }
  
  return {
    allowed: errors.length === 0,
    errors,
    dailyUsage: {
      tokens: dailyTokens,
      cost: dailyUsage.cost,
      requests: dailyUsage.requests
    },
    monthlyUsage: {
      tokens: monthlyTokens,
      cost: monthlyUsage.cost,
      requests: monthlyUsage.requests
    }
  };
};

/**
 * 获取今日使用统计
 */
export const getTodayUsage = () => {
  const data = getUsageData();
  const dateKey = new Date().toISOString().split('T')[0];
  return data.daily[dateKey] || { input: 0, output: 0, requests: 0, cost: 0 };
};

/**
 * 获取本月使用统计
 */
export const getMonthUsage = () => {
  const data = getUsageData();
  const monthKey = new Date().toISOString().split('T')[0].substring(0, 7);
  return data.monthly[monthKey] || { input: 0, output: 0, requests: 0, cost: 0 };
};

/**
 * 获取最近 N 天的使用趋势
 */
export const getUsageTrend = (days = 7) => {
  const data = getUsageData();
  const trend = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const usage = data.daily[dateKey] || { input: 0, output: 0, requests: 0, cost: 0 };
    trend.push({
      date: dateKey,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      ...usage,
      totalTokens: usage.input + usage.output
    });
  }
  
  return trend;
};

/**
 * 清除使用数据
 */
export const clearUsageData = () => {
  localStorage.removeItem(USAGE_STORAGE_KEY);
};

/**
 * 格式化 token 数量
 */
export const formatTokens = (tokens) => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

/**
 * 估算提示词的 token 数量 (粗略估算)
 */
export const estimateTokens = (text) => {
  if (!text) return 0;
  // 粗略估算：英文约 4 字符/token，中文约 1.5 字符/token
  const englishChars = (text.match(/[a-zA-Z0-9\s]/g) || []).length;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - englishChars - chineseChars;
  
  return Math.ceil(englishChars / 4 + chineseChars / 1.5 + otherChars / 3);
};
