import { PenTool, Mail } from 'lucide-react';

const WritingModeSwitch = ({ mode, onModeChange }) => {
  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6">
      <button
        onClick={() => onModeChange('essay')}
        className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
          mode === 'essay'
            ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 font-medium'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <PenTool className="w-4 h-4" />
        <span className="text-[15px]">大作文</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          mode === 'essay' 
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300' 
            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
        }`}>20分</span>
      </button>
      <button
        onClick={() => onModeChange('letter')}
        className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
          mode === 'letter'
            ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400 font-medium'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <Mail className="w-4 h-4" />
        <span className="text-[15px]">小作文</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          mode === 'letter' 
            ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300' 
            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
        }`}>10分</span>
      </button>
    </div>
  );
};

export default WritingModeSwitch;
