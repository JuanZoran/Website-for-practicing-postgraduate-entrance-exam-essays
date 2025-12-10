/**
 * 学习分析服务
 * 提供错误模式分析、自适应难度、进度跟踪等功能
 */

const LEARNING_DATA_KEY = 'kaoyan_learning_analytics';
const ERROR_PATTERNS_KEY = 'kaoyan_error_patterns';

/**
 * 错误类型定义
 */
export const ERROR_TYPES = {
  GRAMMAR: 'grammar',
  VOCABULARY: 'vocabulary', 
  LOGIC: 'logic',
  STRUCTURE: 'structure',
  COHERENCE: 'coherence',
  SPELLING: 'spelling'
};

/**
 * 难度级别
 */
export const DIFFICULTY_LEVELS = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4
};

/**
 * 获取学习数据
 */
export const getLearningData = () => {
  try {
    const data = localStorage.getItem(LEARNING_DATA_KEY);
    return data ? JSON.parse(data) : {
      totalPractices: 0,
      totalWords: 0,
      averageScore: 0,
      scores: [],
      practiceHistory: [],
      currentLevel: DIFFICULTY_LEVELS.BEGINNER,
      streakDays: 0,
      lastPracticeDate: null,
      weeklyGoal: 5,
      weeklyProgress: 0
    };
  } catch (e) {
    console.warn('Failed to load learning data:', e);
    return null;
  }
};

/**
 * 保存学习数据
 */
export const saveLearningData = (data) => {
  try {
    localStorage.setItem(LEARNING_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save learning data:', e);
  }
};

/**
 * 记录练习结果
 */
export const recordPractice = (result) => {
  const data = getLearningData();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // 更新基础统计
  data.totalPractices++;
  data.totalWords += result.wordCount || 0;
  data.scores.push(result.score || 0);
  data.averageScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
  
  // 更新连续天数
  if (data.lastPracticeDate !== today) {
    const lastDate = data.lastPracticeDate ? new Date(data.lastPracticeDate) : null;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastDate && lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
      data.streakDays++;
    } else if (!lastDate || lastDate.toISOString().split('T')[0] !== today) {
      data.streakDays = 1;
    }
    data.lastPracticeDate = today;
    data.weeklyProgress++;
  }
  
  // 记录详细历史
  data.practiceHistory.push({
    date: now.toISOString(),
    topicId: result.topicId,
    score: result.score,
    wordCount: result.wordCount,
    errors: result.errors || [],
    timeSpent: result.timeSpent || 0
  });
  
  // 只保留最近100条记录
  if (data.practiceHistory.length > 100) {
    data.practiceHistory = data.practiceHistory.slice(-100);
  }
  
  // 自适应难度调整
  data.currentLevel = calculateAdaptiveLevel(data);
  
  saveLearningData(data);
  
  // 触发学习路径更新事件（避免循环依赖）
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('practiceCompleted', {
      detail: { topicId: result.topicId, score: result.score, feedback: result.feedback }
    }));
  }
  
  return data;
};

/**
 * 计算自适应难度级别
 */
const calculateAdaptiveLevel = (data) => {
  const recentScores = data.scores.slice(-10);
  if (recentScores.length < 3) return DIFFICULTY_LEVELS.BEGINNER;
  
  const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  
  if (avgRecent >= 85) return DIFFICULTY_LEVELS.EXPERT;
  if (avgRecent >= 70) return DIFFICULTY_LEVELS.ADVANCED;
  if (avgRecent >= 55) return DIFFICULTY_LEVELS.INTERMEDIATE;
  return DIFFICULTY_LEVELS.BEGINNER;
};

/**
 * 获取错误模式数据
 */
export const getErrorPatterns = () => {
  try {
    const data = localStorage.getItem(ERROR_PATTERNS_KEY);
    return data ? JSON.parse(data) : {
      patterns: {},
      frequentErrors: [],
      improvements: []
    };
  } catch (e) {
    return { patterns: {}, frequentErrors: [], improvements: [] };
  }
};

/**
 * 记录错误模式
 */
export const recordErrorPattern = (errorType, details) => {
  const patterns = getErrorPatterns();
  
  if (!patterns.patterns[errorType]) {
    patterns.patterns[errorType] = { count: 0, examples: [], lastOccurrence: null };
  }
  
  patterns.patterns[errorType].count++;
  patterns.patterns[errorType].lastOccurrence = new Date().toISOString();
  
  if (details && patterns.patterns[errorType].examples.length < 10) {
    patterns.patterns[errorType].examples.push(details);
  }
  
  // 更新频繁错误列表
  patterns.frequentErrors = Object.entries(patterns.patterns)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([type, data]) => ({ type, ...data }));
  
  localStorage.setItem(ERROR_PATTERNS_KEY, JSON.stringify(patterns));
  return patterns;
};

/**
 * 分析文章错误并提取模式
 */
export const analyzeEssayErrors = (feedback) => {
  const errorTypes = [];
  const feedbackLower = (feedback || '').toLowerCase();
  
  // 语法错误检测
  if (feedbackLower.includes('语法') || feedbackLower.includes('grammar') || 
      feedbackLower.includes('时态') || feedbackLower.includes('主谓')) {
    errorTypes.push({ type: ERROR_TYPES.GRAMMAR, weight: 1 });
  }
  
  // 词汇错误检测
  if (feedbackLower.includes('词汇') || feedbackLower.includes('用词') || 
      feedbackLower.includes('vocabulary') || feedbackLower.includes('单词')) {
    errorTypes.push({ type: ERROR_TYPES.VOCABULARY, weight: 1 });
  }
  
  // 逻辑错误检测
  if (feedbackLower.includes('逻辑') || feedbackLower.includes('论证') || 
      feedbackLower.includes('logic') || feedbackLower.includes('推理')) {
    errorTypes.push({ type: ERROR_TYPES.LOGIC, weight: 1 });
  }
  
  // 结构错误检测
  if (feedbackLower.includes('结构') || feedbackLower.includes('段落') || 
      feedbackLower.includes('structure') || feedbackLower.includes('组织')) {
    errorTypes.push({ type: ERROR_TYPES.STRUCTURE, weight: 1 });
  }
  
  // 连贯性错误检测
  if (feedbackLower.includes('连贯') || feedbackLower.includes('衔接') || 
      feedbackLower.includes('coherence') || feedbackLower.includes('过渡')) {
    errorTypes.push({ type: ERROR_TYPES.COHERENCE, weight: 1 });
  }
  
  return errorTypes;
};

/**
 * 生成针对性练习建议
 */
export const generatePracticeRecommendations = () => {
  const patterns = getErrorPatterns();
  const learningData = getLearningData();
  const recommendations = [];
  
  // 基于错误模式推荐
  patterns.frequentErrors.forEach(error => {
    const rec = getRecommendationForError(error.type, error.count);
    if (rec) recommendations.push(rec);
  });
  
  // 基于难度级别推荐
  const levelRec = getLevelBasedRecommendation(learningData.currentLevel);
  if (levelRec) recommendations.push(levelRec);
  
  // 基于练习频率推荐
  if (learningData.weeklyProgress < learningData.weeklyGoal) {
    recommendations.push({
      type: 'frequency',
      title: '保持练习频率',
      description: `本周还需完成 ${learningData.weeklyGoal - learningData.weeklyProgress} 次练习`,
      priority: 'medium'
    });
  }
  
  return recommendations.slice(0, 5);
};

/**
 * 根据错误类型获取推荐
 */
const getRecommendationForError = (errorType, count) => {
  const recommendations = {
    [ERROR_TYPES.GRAMMAR]: {
      title: '语法强化练习',
      description: '建议复习基础语法规则，特别是时态和主谓一致',
      exercises: ['时态填空', '句子改错', '语法选择题'],
      priority: count > 5 ? 'high' : 'medium'
    },
    [ERROR_TYPES.VOCABULARY]: {
      title: '词汇扩展训练',
      description: '增加高级词汇的使用，避免重复用词',
      exercises: ['同义词替换', '词汇搭配', '高级词汇应用'],
      priority: count > 5 ? 'high' : 'medium'
    },
    [ERROR_TYPES.LOGIC]: {
      title: '逻辑论证训练',
      description: '加强论点论据的逻辑关系，提升论证说服力',
      exercises: ['论证分析', '逻辑推理', '反驳练习'],
      priority: count > 3 ? 'high' : 'medium'
    },
    [ERROR_TYPES.STRUCTURE]: {
      title: '文章结构优化',
      description: '学习标准的议论文结构，合理安排段落',
      exercises: ['段落排序', '提纲写作', '结构分析'],
      priority: count > 3 ? 'high' : 'medium'
    },
    [ERROR_TYPES.COHERENCE]: {
      title: '连贯性提升',
      description: '使用过渡词和连接词，增强文章流畅度',
      exercises: ['过渡词填空', '段落衔接', '逻辑连接词'],
      priority: count > 3 ? 'high' : 'medium'
    }
  };
  
  return recommendations[errorType] ? { type: errorType, ...recommendations[errorType] } : null;
};

/**
 * 根据难度级别获取推荐
 */
const getLevelBasedRecommendation = (level) => {
  const recommendations = {
    [DIFFICULTY_LEVELS.BEGINNER]: {
      type: 'level',
      title: '基础巩固',
      description: '建议从简单话题开始，打好基础',
      priority: 'high'
    },
    [DIFFICULTY_LEVELS.INTERMEDIATE]: {
      type: 'level',
      title: '能力提升',
      description: '可以尝试更复杂的话题，增加论证深度',
      priority: 'medium'
    },
    [DIFFICULTY_LEVELS.ADVANCED]: {
      type: 'level',
      title: '高级挑战',
      description: '挑战抽象话题，提升语言表达的精准度',
      priority: 'medium'
    },
    [DIFFICULTY_LEVELS.EXPERT]: {
      type: 'level',
      title: '专家模式',
      description: '保持高水平，尝试限时写作和复杂论题',
      priority: 'low'
    }
  };
  
  return recommendations[level];
};

/**
 * 获取进步轨迹数据
 */
export const getProgressTrack = () => {
  const data = getLearningData();
  const history = data.practiceHistory || [];
  
  // 按周分组
  const weeklyData = {};
  history.forEach(record => {
    const date = new Date(record.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { scores: [], wordCounts: [], count: 0 };
    }
    weeklyData[weekKey].scores.push(record.score || 0);
    weeklyData[weekKey].wordCounts.push(record.wordCount || 0);
    weeklyData[weekKey].count++;
  });
  
  // 计算每周平均
  const progressData = Object.entries(weeklyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, data]) => ({
      week,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      avgWords: data.wordCounts.reduce((a, b) => a + b, 0) / data.wordCounts.length,
      practiceCount: data.count
    }));
  
  return progressData;
};

/**
 * 获取周一日期
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/**
 * 计算写作风格指标
 */
export const analyzeWritingStyle = (text) => {
  if (!text) return null;
  
  const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim());
  const words = text.split(/\s+/).filter(w => w.trim());
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  // 平均句长
  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  
  // 词汇多样性 (Type-Token Ratio)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const lexicalDiversity = uniqueWords.size / Math.max(words.length, 1);
  
  // 段落平均长度
  const avgParagraphLength = words.length / Math.max(paragraphs.length, 1);
  
  // 复杂词汇比例 (长度>6的词)
  const complexWords = words.filter(w => w.length > 6);
  const complexWordRatio = complexWords.length / Math.max(words.length, 1);
  
  // 连接词使用
  const connectors = ['however', 'therefore', 'moreover', 'furthermore', 'nevertheless',
    'consequently', 'meanwhile', 'although', 'because', 'since', 'while',
    '然而', '因此', '此外', '而且', '尽管', '虽然', '因为', '所以'];
  const connectorCount = connectors.reduce((count, conn) => {
    const regex = new RegExp(conn, 'gi');
    return count + (text.match(regex) || []).length;
  }, 0);
  
  return {
    totalWords: words.length,
    totalSentences: sentences.length,
    totalParagraphs: paragraphs.length,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    lexicalDiversity: Math.round(lexicalDiversity * 100) / 100,
    avgParagraphLength: Math.round(avgParagraphLength),
    complexWordRatio: Math.round(complexWordRatio * 100),
    connectorCount,
    styleScore: calculateStyleScore({
      avgSentenceLength,
      lexicalDiversity,
      complexWordRatio,
      connectorCount,
      paragraphs: paragraphs.length
    })
  };
};

/**
 * 计算风格得分
 */
const calculateStyleScore = (metrics) => {
  let score = 60; // 基础分
  
  // 句子长度适中 (15-25词最佳)
  if (metrics.avgSentenceLength >= 15 && metrics.avgSentenceLength <= 25) {
    score += 10;
  } else if (metrics.avgSentenceLength >= 10 && metrics.avgSentenceLength <= 30) {
    score += 5;
  }
  
  // 词汇多样性
  if (metrics.lexicalDiversity >= 0.5) score += 10;
  else if (metrics.lexicalDiversity >= 0.3) score += 5;
  
  // 复杂词汇使用
  if (metrics.complexWordRatio >= 0.15 && metrics.complexWordRatio <= 0.3) score += 10;
  else if (metrics.complexWordRatio >= 0.1) score += 5;
  
  // 连接词使用
  if (metrics.connectorCount >= 3) score += 10;
  else if (metrics.connectorCount >= 1) score += 5;
  
  return Math.min(100, score);
};

/**
 * 提取文章关键词（用于词云）
 */
export const extractKeywords = (text) => {
  if (!text) return [];
  
  // 停用词列表
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
    'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
    'i', 'me', 'my', 'who', 'which', 'what', 'where', 'when', 'why', 'how',
    '的', '是', '在', '了', '和', '与', '或', '但', '而', '也', '都', '就',
    '这', '那', '有', '没', '不', '很', '更', '最', '会', '能', '可以'
  ]);
  
  // 提取词汇
  const words = text.toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  // 统计词频
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // 排序并返回前30个
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));
};
