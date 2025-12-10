/**
 * 分数显示组件
 * 根据不同分数显示不同的视觉效果
 */

import { CheckCircle, AlertTriangle, XCircle, Award, Star, TrendingUp } from 'lucide-react';

/**
 * 获取分数等级配置
 * @param {number} score - 分数
 * @param {number} maxScore - 满分
 * @returns {object} 等级配置
 */
const getScoreLevel = (score, maxScore) => {
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 90) {
    return {
      level: 'excellent',
      label: '优秀',
      emoji: '🎉',
      icon: Award,
      colors: {
        bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
        text: 'text-amber-500',
        border: 'border-amber-400',
        light: 'bg-amber-50 dark:bg-amber-900/20',
        glow: 'shadow-amber-200 dark:shadow-amber-900/50'
      }
    };
  } else if (percentage >= 75) {
    return {
      level: 'good',
      label: '良好',
      emoji: '👍',
      icon: Star,
      colors: {
        bg: 'bg-gradient-to-br from-green-400 to-emerald-500',
        text: 'text-green-500',
        border: 'border-green-400',
        light: 'bg-green-50 dark:bg-green-900/20',
        glow: 'shadow-green-200 dark:shadow-green-900/50'
      }
    };
  } else if (percentage >= 60) {
    return {
      level: 'pass',
      label: '及格',
      emoji: '✓',
      icon: CheckCircle,
      colors: {
        bg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
        text: 'text-blue-500',
        border: 'border-blue-400',
        light: 'bg-blue-50 dark:bg-blue-900/20',
        glow: 'shadow-blue-200 dark:shadow-blue-900/50'
      }
    };
  } else if (percentage >= 40) {
    return {
      level: 'warning',
      label: '待提高',
      emoji: '⚠️',
      icon: AlertTriangle,
      colors: {
        bg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
        text: 'text-amber-500',
        border: 'border-amber-400',
        light: 'bg-amber-50 dark:bg-amber-900/20',
        glow: 'shadow-amber-200 dark:shadow-amber-900/50'
      }
    };
  } else {
    return {
      level: 'poor',
      label: '需努力',
      emoji: '💪',
      icon: TrendingUp,
      colors: {
        bg: 'bg-gradient-to-br from-red-400 to-rose-500',
        text: 'text-red-500',
        border: 'border-red-400',
        light: 'bg-red-50 dark:bg-red-900/20',
        glow: 'shadow-red-200 dark:shadow-red-900/50'
      }
    };
  }
};

/**
 * 润色评分显示 (10分制)
 */
export const GrammarScoreDisplay = ({ score, comment }) => {
  const level = getScoreLevel(score, 10);
  const Icon = level.icon;
  
  return (
    <div className={`p-4 rounded-2xl ${level.colors.light} border ${level.colors.border} space-y-3`}>
      {/* 分数头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl ${level.colors.bg} flex items-center justify-center shadow-lg ${level.colors.glow}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${level.colors.text}`}>{score}</span>
              <span className="text-slate-400 text-sm">/10</span>
            </div>
            <span className="text-xs text-slate-500">{level.label}</span>
          </div>
        </div>
        <span className="text-2xl">{level.emoji}</span>
      </div>
      
      {/* 进度条 */}
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${level.colors.bg} rounded-full transition-all duration-500`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};

/**
 * 阅卷评分显示 (20分制)
 */
export const FinalScoreDisplay = ({ score, comment }) => {
  const level = getScoreLevel(score, 20);
  const Icon = level.icon;
  const percentage = (score / 20) * 100;
  
  // 根据分数选择背景渐变
  const getBgGradient = () => {
    if (percentage >= 90) return 'from-amber-600 via-orange-600 to-red-600';
    if (percentage >= 75) return 'from-emerald-600 via-green-600 to-teal-600';
    if (percentage >= 60) return 'from-blue-600 via-indigo-600 to-purple-600';
    if (percentage >= 40) return 'from-amber-700 via-yellow-600 to-orange-600';
    return 'from-slate-700 via-slate-800 to-slate-900';
  };
  
  return (
    <div className={`card-breathe bg-gradient-to-br ${getBgGradient()} text-white relative overflow-hidden`}>
      {/* 装饰背景 */}
      {percentage >= 75 && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
        </div>
      )}
      
      <div className="relative z-10">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white/60 text-sm">阅卷报告</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/80">{level.label}</span>
                <span className="text-xl">{level.emoji}</span>
              </div>
            </div>
          </div>
          
          {/* 分数 */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">{score}</span>
              <span className="text-white/50 text-lg">/20</span>
            </div>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* 分数段说明 */}
        <div className="flex justify-between text-xs text-white/40 mb-4">
          <span>0</span>
          <span>及格线 12</span>
          <span>20</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 审题状态显示
 */
export const LogicStatusDisplay = ({ status, comment }) => {
  const isPass = status === 'pass';
  
  return (
    <div className={`p-4 rounded-2xl ${
      isPass 
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isPass 
            ? 'bg-green-500' 
            : 'bg-amber-500'
        }`}>
          {isPass 
            ? <CheckCircle className="w-4 h-4 text-white" />
            : <AlertTriangle className="w-4 h-4 text-white" />
          }
        </div>
        <div>
          <span className={`font-medium ${
            isPass 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-amber-700 dark:text-amber-300'
          }`}>
            {isPass ? '审题通过 ✓' : '需要改进 ⚠️'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default { GrammarScoreDisplay, FinalScoreDisplay, LogicStatusDisplay };
