/**
 * 组件统一导出
 */

// 通用组件
export * from './common';

// 业务组件
export { default as AISettings } from './AISettings';
export { default as AuthModal } from './AuthModal';
export { default as EnhancedText } from './EnhancedText';
export { FollowUpChat } from './FollowUpChat';
export { default as PromptManager } from './PromptManager';
export { GrammarScoreDisplay, FinalScoreDisplay, LogicStatusDisplay } from './ScoreDisplay';
export { default as StreamingText } from './StreamingText';
export { default as UsageStats } from './UsageStats';

// 从 composition.jsx 拆分出的组件
export { default as HistoryDrawer } from './HistoryDrawer';
export { default as SimpleMarkdown } from './SimpleMarkdown';
export { default as QuestionVisualizer } from './QuestionVisualizer';
export { default as TopicGeneratorModal } from './TopicGeneratorModal';
export { default as VocabSidebar } from './VocabSidebar';
export { default as EssayWorkflowManager } from './EssayWorkflowManager';

// 高级功能组件
export { default as PersonalizedLearning } from './PersonalizedLearning';
export { default as AdvancedAnalytics } from './AdvancedAnalytics';
export { default as LearningPathPlanner } from './LearningPathPlanner';
export { default as WritingMaterialLibrary } from './WritingMaterialLibrary';

// 错误处理组件
export { ErrorToast, InlineError, RetryIndicator, ErrorFallback } from './ErrorDisplay';
