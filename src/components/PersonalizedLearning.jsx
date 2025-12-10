/**
 * 个性化学习组件
 * 提供错误模式分析、针对性练习推荐、自适应难度、进度跟踪
 */

import React, { useState, useEffect } from 'react';
import { 
  Target, TrendingUp, Award, AlertTriangle, CheckCircle, 
  BookOpen, Zap, Calendar, ChevronRight, X, BarChart2,
  Brain, Lightbulb, RefreshCw
} from 'lucide-react';
import {
  getLearningData,
  getErrorPatterns,
  generatePracticeRecommendations,
  getProgressTrack,
  DIFFICULTY_LEVELS,
  ERROR_TYPES
} from '../services/learningAnalyticsService';

const PersonalizedLearning = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [learningData, setLearningData] = useState(null);
  const [errorPatterns, setErrorPatterns] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setLearningData(getLearningData());
    setErrorPatterns(getErrorPatterns());
    setRecommendations(generatePracticeRecommendations());
    setProgressData(getProgressTrack());
  };

  if (!isOpen) return null;

  const getLevelName = (level) => {
    const names = {
      [DIFFICULTY_LEVELS.BEGINNER]: '入门',
      [DIFFICULTY_LEVELS.INTERMEDIATE]: '进阶',
      [DIFFICULTY_LEVELS.ADVANCED]: '高级',
      [DIFFICULTY_LEVELS.EXPERT]: '专家'
    };
    return names[level] || '入门';
  };

  const getLevelColor = (level) => {
    const colors = {
      [DIFFICULTY_LEVELS.BEGINNER]: 'text-green-600 bg-green-100',
      [DIFFICULTY_LEVELS.INTERMEDIATE]: 'text-blue-600 bg-blue-100',
      [DIFFICULTY_LEVELS.ADVANCED]: 'text-purple-600 bg-purple-100',
      [DIFFICULTY_LEVELS.EXPERT]: 'text-amber-600 bg-amber-100'
    };
    return colors[level] || colors[DIFFICULTY_LEVELS.BEGINNER];
  };

  const getErrorTypeName = (type) => {
    const names = {
      [ERROR_TYPES.GRAMMAR]: '语法',
      [ERROR_TYPES.VOCABULARY]: '词汇',
      [ERROR_TYPES.LOGIC]: '逻辑',
      [ERROR_TYPES.STRUCTURE]: '结构',
      [ERROR_TYPES.COHERENCE]: '连贯性',
      [ERROR_TYPES.SPELLING]: '拼写'
    };
    return names[type] || type;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
      medium: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
      low: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white dark:bg-slate-900 rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-lg">个性化学习</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'overview', label: '概览', icon: BarChart2 },
            { id: 'errors', label: '错误分析', icon: AlertTriangle },
            { id: 'recommend', label: '推荐练习', icon: Lightbulb },
            { id: 'progress', label: '进步轨迹', icon: TrendingUp }
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
          {activeTab === 'overview' && (
            <OverviewTab data={learningData} getLevelName={getLevelName} getLevelColor={getLevelColor} />
          )}
          {activeTab === 'errors' && (
            <ErrorsTab patterns={errorPatterns} getErrorTypeName={getErrorTypeName} />
          )}
          {activeTab === 'recommend' && (
            <RecommendTab recommendations={recommendations} getPriorityColor={getPriorityColor} />
          )}
          {activeTab === 'progress' && (
            <ProgressTab data={progressData} learningData={learningData} />
          )}
        </div>
      </div>
    </>
  );
};

// 概览标签页
const OverviewTab = ({ data, getLevelName, getLevelColor }) => {
  if (!data) return <div className="text-center py-8 text-slate-500">暂无数据</div>;

  return (
    <div className="space-y-4">
      {/* 当前等级 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm">当前等级</p>
            <p className="text-2xl font-bold mt-1">{getLevelName(data.currentLevel)}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getLevelColor(data.currentLevel)}`}>
            Level {data.currentLevel}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>连续 {data.streakDays} 天</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>本周 {data.weeklyProgress}/{data.weeklyGoal}</span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={BookOpen} label="总练习次数" value={data.totalPractices} color="blue" />
        <StatCard icon={Award} label="平均分数" value={Math.round(data.averageScore)} suffix="分" color="green" />
        <StatCard icon={Calendar} label="总字数" value={data.totalWords.toLocaleString()} color="purple" />
        <StatCard icon={TrendingUp} label="最近得分" value={data.scores.slice(-1)[0] || '-'} suffix="分" color="amber" />
      </div>

      {/* 周目标进度 */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">本周目标</span>
          <span className="text-sm text-slate-500">{data.weeklyProgress}/{data.weeklyGoal} 次练习</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{ width: `${Math.min(100, (data.weeklyProgress / data.weeklyGoal) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// 统计卡片组件
const StatCard = ({ icon: Icon, label, value, suffix = '', color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
      <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold">{value}{suffix}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
};

// 错误分析标签页
const ErrorsTab = ({ patterns, getErrorTypeName }) => {
  if (!patterns || !patterns.frequentErrors?.length) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">暂无错误记录</p>
        <p className="text-sm text-slate-400 mt-1">继续练习，系统会自动分析你的错误模式</p>
      </div>
    );
  }

  const maxCount = Math.max(...patterns.frequentErrors.map(e => e.count));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">基于你的练习历史，以下是最常见的错误类型：</p>
      
      {patterns.frequentErrors.map((error, idx) => (
        <div key={error.type} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-center font-medium">
                {idx + 1}
              </span>
              <span className="font-medium">{getErrorTypeName(error.type)}</span>
            </div>
            <span className="text-sm text-slate-500">{error.count} 次</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${(error.count / maxCount) * 100}%` }}
            />
          </div>
          {error.examples?.length > 0 && (
            <p className="text-xs text-slate-400 mt-2 truncate">
              示例: {error.examples[0]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// 推荐练习标签页 - 使用父组件的 useState
const RecommendTab = ({ recommendations, getPriorityColor }) => {
  const [expandedIdx, setExpandedIdx] = React.useState(null);

  if (!recommendations?.length) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">暂无推荐</p>
        <p className="text-sm text-slate-400 mt-1">完成更多练习后，系统会生成个性化建议</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">根据你的学习情况，推荐以下练习：</p>
      
      {recommendations.map((rec, idx) => {
        const isExpanded = expandedIdx === idx;
        return (
          <div 
            key={idx} 
            className={`rounded-2xl p-4 border transition-all ${getPriorityColor(rec.priority)}`}
            onClick={() => setExpandedIdx(isExpanded ? null : idx)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                rec.priority === 'high' 
                  ? 'bg-red-100 dark:bg-red-900/40' 
                  : rec.priority === 'medium'
                    ? 'bg-amber-100 dark:bg-amber-900/40'
                    : 'bg-green-100 dark:bg-green-900/40'
              }`}>
                {rec.priority === 'high' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : rec.priority === 'medium' ? (
                  <Target className="w-5 h-5 text-amber-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">{rec.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    rec.priority === 'high' 
                      ? 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-200' 
                      : rec.priority === 'medium'
                        ? 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-200'
                        : 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200'
                  }`}>
                    {rec.priority === 'high' ? '重要' : rec.priority === 'medium' ? '建议' : '可选'}
                  </span>
                </div>
                <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {rec.description}
                </p>
                {rec.exercises && (
                  <div className={`flex flex-wrap gap-1.5 mt-3 ${isExpanded ? '' : 'max-h-8 overflow-hidden'}`}>
                    {rec.exercises.map((ex, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white/80 dark:bg-slate-800/80 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                        {ex}
                      </span>
                    ))}
                  </div>
                )}
                {!isExpanded && rec.description && rec.description.length > 60 && (
                  <button className="text-xs text-indigo-500 mt-2 font-medium">
                    点击展开详情
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 进步轨迹标签页
const ProgressTab = ({ data, learningData }) => {
  if (!data?.length) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">暂无进步数据</p>
        <p className="text-sm text-slate-400 mt-1">完成更多练习后，这里会显示你的进步轨迹</p>
      </div>
    );
  }

  const maxScore = Math.max(...data.map(d => d.avgScore));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">你的每周学习进度：</p>
      
      {/* 简易图表 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
        <div className="flex items-end gap-2 h-32">
          {data.slice(-8).map((week, idx) => (
            <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-indigo-500 rounded-t transition-all"
                style={{ height: `${(week.avgScore / maxScore) * 100}%`, minHeight: '4px' }}
              />
              <span className="text-[10px] text-slate-400">{idx + 1}周</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>平均分数趋势</span>
          <span>最近 {Math.min(8, data.length)} 周</span>
        </div>
      </div>

      {/* 详细数据 */}
      <div className="space-y-2">
        {data.slice(-5).reverse().map(week => (
          <div key={week.week} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-600 dark:text-slate-400">{week.week}</span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-indigo-600">{Math.round(week.avgScore)}分</span>
              <span className="text-slate-400">{week.practiceCount}次</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedLearning;
