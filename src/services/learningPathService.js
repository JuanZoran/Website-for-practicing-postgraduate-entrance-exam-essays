/**
 * 智能学习路径规划服务
 * 提供个性化学习路径、分阶段计划、难度自适应推荐
 */

import { getLearningData, DIFFICULTY_LEVELS } from './learningAnalyticsService';

const LEARNING_PATH_KEY = 'kaoyan_learning_path';

/**
 * 学习阶段定义
 */
export const LEARNING_STAGES = {
  FOUNDATION: 'foundation',    // 基础阶段
  INTERMEDIATE: 'intermediate', // 进阶阶段
  ADVANCED: 'advanced',        // 高级阶段
  MASTERY: 'mastery'           // 精通阶段
};

/**
 * 技能维度定义
 */
export const SKILL_DIMENSIONS = {
  VOCABULARY: 'vocabulary',     // 词汇能力
  GRAMMAR: 'grammar',           // 语法能力
  STRUCTURE: 'structure',       // 结构组织
  LOGIC: 'logic',               // 逻辑论证
  EXPRESSION: 'expression'      // 语言表达
};

/**
 * 主题难度映射
 */
export const TOPIC_DIFFICULTY = {
  // 基础话题
  easy: ['2012', '2014', '2020', '2021'],
  // 中等话题
  medium: ['2011', '2013', '2015', '2016', '2017', '2019'],
  // 困难话题
  hard: ['2010', '2018', '2022', '2023', '2024', '2025'],
  // 挑战话题
  expert: ['pred_ai', 'pred_culture', 'pred_resilience', 'pred_public']
};

/**
 * 获取学习路径数据
 */
export const getLearningPath = () => {
  try {
    const data = localStorage.getItem(LEARNING_PATH_KEY);
    return data ? JSON.parse(data) : initializeLearningPath();
  } catch (e) {
    console.warn('Failed to load learning path:', e);
    return initializeLearningPath();
  }
};

/**
 * 初始化学习路径
 */
const initializeLearningPath = () => {
  const initialPath = {
    currentStage: LEARNING_STAGES.FOUNDATION,
    stageProgress: {
      [LEARNING_STAGES.FOUNDATION]: { completed: 0, total: 5, unlocked: true },
      [LEARNING_STAGES.INTERMEDIATE]: { completed: 0, total: 6, unlocked: false },
      [LEARNING_STAGES.ADVANCED]: { completed: 0, total: 6, unlocked: false },
      [LEARNING_STAGES.MASTERY]: { completed: 0, total: 4, unlocked: false }
    },
    skillLevels: {
      [SKILL_DIMENSIONS.VOCABULARY]: 1,
      [SKILL_DIMENSIONS.GRAMMAR]: 1,
      [SKILL_DIMENSIONS.STRUCTURE]: 1,
      [SKILL_DIMENSIONS.LOGIC]: 1,
      [SKILL_DIMENSIONS.EXPRESSION]: 1
    },
    completedTopics: [],
    milestones: [],
    lastUpdated: new Date().toISOString()
  };
  saveLearningPath(initialPath);
  return initialPath;
};

/**
 * 保存学习路径
 */
export const saveLearningPath = (data) => {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(LEARNING_PATH_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save learning path:', e);
  }
};

/**
 * 根据用户水平计算当前阶段
 */
export const calculateCurrentStage = () => {
  const learningData = getLearningData();
  const pathData = getLearningPath();
  
  if (!learningData) return LEARNING_STAGES.FOUNDATION;
  
  const { averageScore, totalPractices, currentLevel } = learningData;
  
  // 基于多维度评估
  if (currentLevel >= DIFFICULTY_LEVELS.EXPERT && averageScore >= 80 && totalPractices >= 30) {
    return LEARNING_STAGES.MASTERY;
  }
  if (currentLevel >= DIFFICULTY_LEVELS.ADVANCED && averageScore >= 70 && totalPractices >= 20) {
    return LEARNING_STAGES.ADVANCED;
  }
  if (currentLevel >= DIFFICULTY_LEVELS.INTERMEDIATE && averageScore >= 60 && totalPractices >= 10) {
    return LEARNING_STAGES.INTERMEDIATE;
  }
  return LEARNING_STAGES.FOUNDATION;
};

/**
 * 获取阶段详情
 */
export const getStageDetails = (stage) => {
  const stages = {
    [LEARNING_STAGES.FOUNDATION]: {
      name: '基础阶段',
      description: '打好写作基础，掌握基本句型和词汇',
      goals: [
        '掌握基础写作词汇200+',
        '熟悉议论文基本结构',
        '能够完成简单话题写作',
        '达到60分以上平均分'
      ],
      skills: ['基础词汇', '简单句型', '段落结构', '基本论证'],
      recommendedTopics: TOPIC_DIFFICULTY.easy,
      targetScore: 60,
      color: 'green',
      icon: '🌱'
    },
    [LEARNING_STAGES.INTERMEDIATE]: {
      name: '进阶阶段',
      description: '提升表达能力，丰富论证方法',
      goals: [
        '扩展高级词汇至400+',
        '掌握复杂句式运用',
        '学会多角度论证',
        '达到70分以上平均分'
      ],
      skills: ['高级词汇', '复杂句型', '论证技巧', '过渡衔接'],
      recommendedTopics: TOPIC_DIFFICULTY.medium,
      targetScore: 70,
      color: 'blue',
      icon: '📚'
    },
    [LEARNING_STAGES.ADVANCED]: {
      name: '高级阶段',
      description: '精进写作技巧，追求语言精准',
      goals: [
        '熟练运用高级表达',
        '掌握多种论证模式',
        '提升文章深度和广度',
        '达到80分以上平均分'
      ],
      skills: ['精准表达', '深度论证', '批判思维', '文章润色'],
      recommendedTopics: TOPIC_DIFFICULTY.hard,
      targetScore: 80,
      color: 'purple',
      icon: '🎯'
    },
    [LEARNING_STAGES.MASTERY]: {
      name: '精通阶段',
      description: '追求卓越，形成个人风格',
      goals: [
        '形成独特写作风格',
        '能够应对任何话题',
        '限时高质量完成',
        '稳定85分以上'
      ],
      skills: ['个人风格', '创新表达', '快速构思', '完美收尾'],
      recommendedTopics: TOPIC_DIFFICULTY.expert,
      targetScore: 85,
      color: 'amber',
      icon: '👑'
    }
  };
  return stages[stage] || stages[LEARNING_STAGES.FOUNDATION];
};

/**
 * 生成个性化学习路径
 */
export const generatePersonalizedPath = () => {
  const learningData = getLearningData();
  const pathData = getLearningPath();
  const currentStage = calculateCurrentStage();
  
  // 更新阶段解锁状态
  const stageOrder = [LEARNING_STAGES.FOUNDATION, LEARNING_STAGES.INTERMEDIATE, 
                     LEARNING_STAGES.ADVANCED, LEARNING_STAGES.MASTERY];
  const currentIdx = stageOrder.indexOf(currentStage);
  
  stageOrder.forEach((stage, idx) => {
    pathData.stageProgress[stage].unlocked = idx <= currentIdx;
  });
  
  pathData.currentStage = currentStage;
  saveLearningPath(pathData);
  
  return {
    currentStage,
    stageDetails: getStageDetails(currentStage),
    nextStage: stageOrder[currentIdx + 1] ? getStageDetails(stageOrder[currentIdx + 1]) : null,
    progress: calculateOverallProgress(pathData),
    recommendations: generateRecommendations(learningData, currentStage)
  };
};

/**
 * 计算总体进度
 */
const calculateOverallProgress = (pathData) => {
  const stages = Object.values(pathData.stageProgress);
  const totalCompleted = stages.reduce((sum, s) => sum + s.completed, 0);
  const totalRequired = stages.reduce((sum, s) => sum + s.total, 0);
  return Math.round((totalCompleted / totalRequired) * 100);
};

/**
 * 生成学习建议
 */
const generateRecommendations = (learningData, currentStage) => {
  const recommendations = [];
  const stageDetails = getStageDetails(currentStage);
  
  if (!learningData || learningData.totalPractices < 3) {
    recommendations.push({
      type: 'start',
      title: '开始你的学习之旅',
      description: '完成3篇基础练习，系统将为你生成个性化路径',
      priority: 'high',
      action: '开始练习'
    });
    return recommendations;
  }
  
  // 基于分数推荐
  if (learningData.averageScore < stageDetails.targetScore) {
    recommendations.push({
      type: 'improve',
      title: '提升目标分数',
      description: `当前平均分 ${Math.round(learningData.averageScore)}，目标 ${stageDetails.targetScore} 分`,
      priority: 'high',
      action: '针对性练习'
    });
  }
  
  // 基于练习频率推荐
  if (learningData.weeklyProgress < learningData.weeklyGoal) {
    recommendations.push({
      type: 'frequency',
      title: '保持练习节奏',
      description: `本周还需完成 ${learningData.weeklyGoal - learningData.weeklyProgress} 次练习`,
      priority: 'medium',
      action: '继续练习'
    });
  }
  
  // 基于连续天数推荐
  if (learningData.streakDays >= 7) {
    recommendations.push({
      type: 'streak',
      title: '保持连续学习',
      description: `已连续学习 ${learningData.streakDays} 天，继续保持！`,
      priority: 'low',
      action: '今日练习'
    });
  }
  
  return recommendations;
};

/**
 * 获取推荐主题列表
 */
export const getRecommendedTopics = (examData) => {
  const currentStage = calculateCurrentStage();
  const stageDetails = getStageDetails(currentStage);
  const pathData = getLearningPath();
  
  // 获取当前阶段推荐的主题ID
  const recommendedIds = stageDetails.recommendedTopics;
  
  // 过滤并排序主题
  const topics = examData
    .filter(topic => recommendedIds.includes(topic.id))
    .map(topic => ({
      ...topic,
      completed: pathData.completedTopics.includes(topic.id),
      difficulty: getDifficultyLevel(topic.id),
      recommended: true
    }));
  
  // 添加一些稍高难度的挑战主题
  const nextStageTopics = getNextStageChallenges(examData, currentStage, pathData);
  
  return {
    recommended: topics,
    challenges: nextStageTopics,
    completed: pathData.completedTopics.length
  };
};

/**
 * 获取主题难度级别
 */
const getDifficultyLevel = (topicId) => {
  if (TOPIC_DIFFICULTY.easy.includes(topicId)) return 1;
  if (TOPIC_DIFFICULTY.medium.includes(topicId)) return 2;
  if (TOPIC_DIFFICULTY.hard.includes(topicId)) return 3;
  if (TOPIC_DIFFICULTY.expert.includes(topicId)) return 4;
  return 2;
};

/**
 * 获取下一阶段挑战主题
 */
const getNextStageChallenges = (examData, currentStage, pathData) => {
  const stageOrder = [LEARNING_STAGES.FOUNDATION, LEARNING_STAGES.INTERMEDIATE, 
                     LEARNING_STAGES.ADVANCED, LEARNING_STAGES.MASTERY];
  const currentIdx = stageOrder.indexOf(currentStage);
  
  if (currentIdx >= stageOrder.length - 1) return [];
  
  const nextStage = stageOrder[currentIdx + 1];
  const nextStageDetails = getStageDetails(nextStage);
  
  return examData
    .filter(topic => nextStageDetails.recommendedTopics.includes(topic.id))
    .slice(0, 2)
    .map(topic => ({
      ...topic,
      completed: pathData.completedTopics.includes(topic.id),
      difficulty: getDifficultyLevel(topic.id),
      isChallenge: true
    }));
};

/**
 * 记录主题完成
 */
export const recordTopicCompletion = (topicId, score) => {
  const pathData = getLearningPath();
  
  if (!pathData.completedTopics.includes(topicId)) {
    pathData.completedTopics.push(topicId);
    
    // 更新阶段进度
    const difficulty = getDifficultyLevel(topicId);
    const stageMap = {
      1: LEARNING_STAGES.FOUNDATION,
      2: LEARNING_STAGES.INTERMEDIATE,
      3: LEARNING_STAGES.ADVANCED,
      4: LEARNING_STAGES.MASTERY
    };
    const stage = stageMap[difficulty];
    if (pathData.stageProgress[stage]) {
      pathData.stageProgress[stage].completed++;
    }
    
    // 检查里程碑
    checkMilestones(pathData, score);
    
    saveLearningPath(pathData);
  }
  
  return pathData;
};

/**
 * 检查并记录里程碑
 */
const checkMilestones = (pathData, score) => {
  const milestones = [
    { id: 'first_essay', condition: pathData.completedTopics.length === 1, title: '初试锋芒', desc: '完成第一篇作文' },
    { id: 'five_essays', condition: pathData.completedTopics.length === 5, title: '小有成就', desc: '完成5篇作文' },
    { id: 'ten_essays', condition: pathData.completedTopics.length === 10, title: '勤学苦练', desc: '完成10篇作文' },
    { id: 'high_score', condition: score >= 80, title: '高分突破', desc: '单篇获得80分以上' },
    { id: 'perfect_score', condition: score >= 90, title: '近乎完美', desc: '单篇获得90分以上' }
  ];
  
  milestones.forEach(m => {
    if (m.condition && !pathData.milestones.find(x => x.id === m.id)) {
      pathData.milestones.push({
        ...m,
        achievedAt: new Date().toISOString()
      });
    }
  });
};

/**
 * 更新技能等级
 */
export const updateSkillLevel = (skill, delta) => {
  const pathData = getLearningPath();
  if (pathData.skillLevels[skill] !== undefined) {
    pathData.skillLevels[skill] = Math.max(1, Math.min(10, pathData.skillLevels[skill] + delta));
    saveLearningPath(pathData);
  }
  return pathData;
};

/**
 * 获取学习统计摘要
 */
export const getLearningStats = () => {
  const learningData = getLearningData();
  const pathData = getLearningPath();
  const currentStage = calculateCurrentStage();
  const stageDetails = getStageDetails(currentStage);
  
  return {
    currentStage: stageDetails.name,
    stageIcon: stageDetails.icon,
    totalCompleted: pathData.completedTopics.length,
    overallProgress: calculateOverallProgress(pathData),
    averageScore: learningData?.averageScore || 0,
    targetScore: stageDetails.targetScore,
    streakDays: learningData?.streakDays || 0,
    milestones: pathData.milestones.length,
    skillLevels: pathData.skillLevels
  };
};

/**
 * 根据AI反馈更新技能等级
 */
export const updateSkillLevelsFromFeedback = (feedback) => {
  if (!feedback) return;
  
  const pathData = getLearningPath();
  const feedbackLower = feedback.toLowerCase();
  
  // 分析反馈中的正面和负面评价
  const positiveKeywords = {
    [SKILL_DIMENSIONS.VOCABULARY]: ['词汇丰富', '用词准确', 'vocabulary', '高级词汇', '词汇多样'],
    [SKILL_DIMENSIONS.GRAMMAR]: ['语法正确', '语法规范', 'grammar', '时态正确', '句法正确'],
    [SKILL_DIMENSIONS.STRUCTURE]: ['结构清晰', '层次分明', 'structure', '段落合理', '组织有序'],
    [SKILL_DIMENSIONS.LOGIC]: ['逻辑清晰', '论证有力', 'logic', '论点明确', '推理合理'],
    [SKILL_DIMENSIONS.EXPRESSION]: ['表达流畅', '语言地道', 'expression', '表达准确', '文笔优美']
  };
  
  const negativeKeywords = {
    [SKILL_DIMENSIONS.VOCABULARY]: ['词汇单一', '用词不当', '词汇贫乏', '重复用词'],
    [SKILL_DIMENSIONS.GRAMMAR]: ['语法错误', '时态错误', '语法问题', '句法错误'],
    [SKILL_DIMENSIONS.STRUCTURE]: ['结构混乱', '层次不清', '段落问题', '组织混乱'],
    [SKILL_DIMENSIONS.LOGIC]: ['逻辑不清', '论证不足', '逻辑问题', '论点模糊'],
    [SKILL_DIMENSIONS.EXPRESSION]: ['表达不清', '语言生硬', '表达问题', '不够流畅']
  };
  
  Object.keys(SKILL_DIMENSIONS).forEach(key => {
    const skill = SKILL_DIMENSIONS[key];
    let delta = 0;
    
    // 检查正面评价
    positiveKeywords[skill]?.forEach(kw => {
      if (feedbackLower.includes(kw.toLowerCase())) delta += 0.3;
    });
    
    // 检查负面评价
    negativeKeywords[skill]?.forEach(kw => {
      if (feedbackLower.includes(kw.toLowerCase())) delta -= 0.2;
    });
    
    // 更新技能等级
    if (delta !== 0 && pathData.skillLevels[skill] !== undefined) {
      pathData.skillLevels[skill] = Math.max(1, Math.min(10, 
        Math.round((pathData.skillLevels[skill] + delta) * 10) / 10
      ));
    }
  });
  
  saveLearningPath(pathData);
  return pathData;
};
