/**
 * 智能学习路径规划组件
 * 提供个性化学习路径、分阶段计划、难度自适应推荐、学习路径可视化
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Map, Target, TrendingUp, Award, ChevronRight, 
  Lock, Unlock, CheckCircle, Circle, Star, Zap,
  BookOpen, Brain, Sparkles, ArrowRight, Trophy,
  Play, BarChart2, Flame, Crown
} from 'lucide-react';
import {
  getLearningPath,
  generatePersonalizedPath,
  getStageDetails,
  getRecommendedTopics,
  getLearningStats,
  LEARNING_STAGES,
  SKILL_DIMENSIONS
} from '../services/learningPathService';
import { getLearningData } from '../services/learningAnalyticsService';

const LearningPathPlanner = ({ isOpen, onClose, examData, onSelectTopic }) => {
  const [activeTab, setActiveTab] = useState('path');
  const [pathData, setPathData] = useState(null);
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // 监听练习完成事件，更新学习路径
  useEffect(() => {
    const handlePracticeCompleted = (event) => {
      const { topicId, score, feedback } = event.detail || {};
      if (topicId) {
        import('../services/learningPathService').then(({ recordTopicCompletion, updateSkillLevelsFromFeedback }) => {
          recordTopicCompletion(topicId, score || 0);
          if (feedback) {
            updateSkillLevelsFromFeedback(feedback);
          }
        });
      }
    };

    window.addEventListener('practiceCompleted', handlePracticeCompleted);
    return () => window.removeEventListener('practiceCompleted', handlePracticeCompleted);
  }, []);

  const loadData = () => {
    const path = generatePersonalizedPath();
    setPathData(path);
    setStats(getLearningStats());
    if (examData) {
      setRecommendations(getRecommendedTopics(examData));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[650px] bg-white dark:bg-slate-900 rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-lg">学习路径规划</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'path', label: '学习路径', icon: Map },
            { id: 'stages', label: '阶段计划', icon: Target },
            { id: 'recommend', label: '智能推荐', icon: Sparkles },
            { id: 'skills', label: '能力雷达', icon: BarChart2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'path' && (
            <PathOverviewTab pathData={pathData} stats={stats} />
          )}
          {activeTab === 'stages' && (
            <StagesTab pathData={pathData} />
          )}
          {activeTab === 'recommend' && (
            <RecommendTab 
              recommendations={recommendations} 
              pathData={pathData}
              onSelectTopic={onSelectTopic}
              onClose={onClose}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsTab stats={stats} />
          )}
        </div>
      </div>
    </>
  );
};

// 路径概览标签页
const PathOverviewTab = ({ pathData, stats }) => {
  if (!pathData || !stats) {
    return <LoadingState />;
  }

  const { currentStage, stageDetails, nextStage, progress } = pathData;

  return (
    <div className="space-y-4">
      {/* 当前阶段卡片 */}
      <div className={`bg-gradient-to-r ${getStageGradient(currentStage)} rounded-2xl p-5 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{stageDetails.icon}</span>
              <span className="text-white/80 text-sm">当前阶段</span>
            </div>
            <h3 className="text-2xl font-bold">{stageDetails.name}</h3>
            <p className="text-white/80 text-sm mt-1">{stageDetails.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{progress}%</div>
            <div className="text-white/70 text-xs">总进度</div>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="mt-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-4 gap-2">
        <QuickStat icon={BookOpen} value={stats.totalCompleted} label="已完成" color="blue" />
        <QuickStat icon={Target} value={Math.round(stats.averageScore)} label="平均分" color="green" />
        <QuickStat icon={Flame} value={stats.streakDays} label="连续天" color="orange" />
        <QuickStat icon={Trophy} value={stats.milestones} label="里程碑" color="purple" />
      </div>

      {/* 下一阶段预览 */}
      {nextStage && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">下一阶段</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{nextStage.icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold">{nextStage.name}</h4>
              <p className="text-xs text-slate-500">{nextStage.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-indigo-600">目标 {nextStage.targetScore}分</div>
            </div>
          </div>
        </div>
      )}

      {/* 当前阶段目标 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600" />
          阶段目标
        </h4>
        <div className="space-y-2">
          {stageDetails.goals.map((goal, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <Circle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-400">{goal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 推荐行动 */}
      {pathData.recommendations?.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-slate-500">推荐行动</h4>
          {pathData.recommendations.slice(0, 2).map((rec, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-xl border ${getPriorityStyle(rec.priority)}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-sm">{rec.title}</h5>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 阶段计划标签页
const StagesTab = ({ pathData }) => {
  if (!pathData) return <LoadingState />;

  const stages = [
    LEARNING_STAGES.FOUNDATION,
    LEARNING_STAGES.INTERMEDIATE,
    LEARNING_STAGES.ADVANCED,
    LEARNING_STAGES.MASTERY
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">系统化的学习路径，从基础到精通</p>
      
      {/* 路径可视化 */}
      <div className="relative">
        {stages.map((stage, idx) => {
          const details = getStageDetails(stage);
          const progress = pathData.stageProgress?.[stage] || { completed: 0, total: 5, unlocked: false };
          const isCurrent = pathData.currentStage === stage;
          const isUnlocked = progress.unlocked;
          const isCompleted = progress.completed >= progress.total;
          
          return (
            <div key={stage} className="relative">
              {/* 连接线 */}
              {idx < stages.length - 1 && (
                <div className={`absolute left-6 top-16 w-0.5 h-8 ${
                  isCompleted ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              )}
              
              <div className={`flex gap-4 p-4 rounded-2xl mb-3 transition-all ${
                isCurrent 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700' 
                  : isUnlocked
                    ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
                    : 'bg-slate-50 dark:bg-slate-800/50 opacity-60'
              }`}>
                {/* 阶段图标 */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCompleted 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : isCurrent
                      ? 'bg-indigo-100 dark:bg-indigo-900/30'
                      : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : isUnlocked ? (
                    <span className="text-2xl">{details.icon}</span>
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                
                {/* 阶段信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{details.name}</h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">当前</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{details.description}</p>
                  
                  {/* 进度条 */}
                  {isUnlocked && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>进度</span>
                        <span>{progress.completed}/{progress.total}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isCompleted ? 'bg-green-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* 技能标签 */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {details.skills.slice(0, 3).map((skill, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* 目标分数 */}
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-bold ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-indigo-600' : 'text-slate-400'
                  }`}>
                    {details.targetScore}
                  </div>
                  <div className="text-xs text-slate-400">目标分</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 智能推荐标签页
const RecommendTab = ({ recommendations, pathData, onSelectTopic, onClose }) => {
  if (!recommendations || !pathData) return <LoadingState />;

  const handleSelect = (topic) => {
    if (onSelectTopic) {
      onSelectTopic(topic);
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">基于你的水平智能推荐的练习主题</p>
      
      {/* 推荐主题 */}
      {recommendations.recommended?.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            适合你的主题
          </h4>
          <div className="space-y-2">
            {recommendations.recommended.map((topic) => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                onSelect={() => handleSelect(topic)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* 挑战主题 */}
      {recommendations.challenges?.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            进阶挑战
          </h4>
          <div className="space-y-2">
            {recommendations.challenges.map((topic) => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                isChallenge
                onSelect={() => handleSelect(topic)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* 完成统计 */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
        <div className="text-3xl font-bold text-indigo-600">{recommendations.completed}</div>
        <div className="text-sm text-slate-500">已完成主题</div>
      </div>
    </div>
  );
};

// 能力雷达标签页
const SkillsTab = ({ stats }) => {
  if (!stats) return <LoadingState />;

  const skills = [
    { key: SKILL_DIMENSIONS.VOCABULARY, name: '词汇能力', icon: '📚', color: 'blue' },
    { key: SKILL_DIMENSIONS.GRAMMAR, name: '语法能力', icon: '✏️', color: 'green' },
    { key: SKILL_DIMENSIONS.STRUCTURE, name: '结构组织', icon: '🏗️', color: 'purple' },
    { key: SKILL_DIMENSIONS.LOGIC, name: '逻辑论证', icon: '🧠', color: 'amber' },
    { key: SKILL_DIMENSIONS.EXPRESSION, name: '语言表达', icon: '💬', color: 'rose' }
  ];

  const maxLevel = 10;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">你的写作能力多维度分析</p>
      
      {/* 雷达图简化版 - 条形图展示 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
        <h4 className="font-medium mb-4">能力等级</h4>
        <div className="space-y-4">
          {skills.map(skill => {
            const level = stats.skillLevels?.[skill.key] || 1;
            const percentage = (level / maxLevel) * 100;
            
            return (
              <div key={skill.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{skill.icon}</span>
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <span className="text-sm text-slate-500">Lv.{level}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getSkillColor(skill.color)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 能力总结 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-white/70 text-xs mb-1">综合等级</div>
          <div className="text-2xl font-bold">{stats.currentStage}</div>
          <div className="text-lg mt-1">{stats.stageIcon}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="text-white/70 text-xs mb-1">目标分数</div>
          <div className="text-2xl font-bold">{stats.targetScore}分</div>
          <div className="text-sm text-white/80 mt-1">当前 {Math.round(stats.averageScore)}分</div>
        </div>
      </div>
      
      {/* 提升建议 */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-600" />
          提升建议
        </h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {getSkillSuggestions(stats.skillLevels).map((suggestion, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// 主题卡片组件
const TopicCard = ({ topic, isChallenge, onSelect }) => {
  const difficultyLabels = ['', '基础', '中等', '困难', '挑战'];
  const difficultyColors = ['', 'text-green-600 bg-green-100', 'text-blue-600 bg-blue-100', 
                           'text-purple-600 bg-purple-100', 'text-amber-600 bg-amber-100'];

  return (
    <div 
      onClick={onSelect}
      className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
        topic.completed 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : isChallenge
            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          topic.completed 
            ? 'bg-green-100 dark:bg-green-900/40'
            : isChallenge
              ? 'bg-purple-100 dark:bg-purple-900/40'
              : 'bg-indigo-100 dark:bg-indigo-900/40'
        }`}>
          {topic.completed ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : isChallenge ? (
            <Zap className="w-5 h-5 text-purple-600" />
          ) : (
            <Play className="w-5 h-5 text-indigo-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-medium text-sm truncate">{topic.title}</h5>
            <span className={`px-1.5 py-0.5 rounded text-xs ${difficultyColors[topic.difficulty]}`}>
              {difficultyLabels[topic.difficulty]}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">{topic.year}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </div>
    </div>
  );
};

// 快速统计组件
const QuickStat = ({ icon: Icon, value, label, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  };

  return (
    <div className={`rounded-xl p-3 text-center ${colors[color]}`}>
      <Icon className="w-4 h-4 mx-auto mb-1" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
};

// 加载状态
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-slate-500">加载中...</p>
    </div>
  </div>
);

// 辅助函数
const getStageGradient = (stage) => {
  const gradients = {
    [LEARNING_STAGES.FOUNDATION]: 'from-green-500 to-emerald-600',
    [LEARNING_STAGES.INTERMEDIATE]: 'from-blue-500 to-indigo-600',
    [LEARNING_STAGES.ADVANCED]: 'from-purple-500 to-violet-600',
    [LEARNING_STAGES.MASTERY]: 'from-amber-500 to-orange-600'
  };
  return gradients[stage] || gradients[LEARNING_STAGES.FOUNDATION];
};

const getPriorityStyle = (priority) => {
  const styles = {
    high: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
    medium: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
    low: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
  };
  return styles[priority] || styles.medium;
};

const getSkillColor = (color) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };
  return colors[color] || 'bg-indigo-500';
};

const getSkillSuggestions = (skillLevels) => {
  const suggestions = [];
  if (!skillLevels) return ['完成更多练习以获取个性化建议'];
  
  const entries = Object.entries(skillLevels);
  const sorted = entries.sort((a, b) => a[1] - b[1]);
  const weakest = sorted[0];
  
  const suggestionMap = {
    [SKILL_DIMENSIONS.VOCABULARY]: '多积累高级词汇和短语，尝试在写作中使用同义词替换',
    [SKILL_DIMENSIONS.GRAMMAR]: '复习语法规则，特别注意时态一致性和主谓一致',
    [SKILL_DIMENSIONS.STRUCTURE]: '学习标准的议论文结构，练习写作提纲',
    [SKILL_DIMENSIONS.LOGIC]: '加强论证训练，学习使用例证、对比等论证方法',
    [SKILL_DIMENSIONS.EXPRESSION]: '多阅读范文，学习地道的英语表达方式'
  };
  
  if (weakest && weakest[1] < 5) {
    suggestions.push(suggestionMap[weakest[0]] || '继续练习提升整体水平');
  }
  
  suggestions.push('每天坚持练习，保持学习连续性');
  suggestions.push('完成练习后认真阅读AI反馈，针对性改进');
  
  return suggestions;
};

export default LearningPathPlanner;
