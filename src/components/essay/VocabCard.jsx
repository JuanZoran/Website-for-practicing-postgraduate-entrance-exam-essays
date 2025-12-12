import PropTypes from 'prop-types';
import { PlusCircle } from 'lucide-react';

const getColorScheme = (meaning) => {
  const m = (meaning || '').toLowerCase();
  if (m.includes('n.') || m.includes('名词')) {
    return { border: 'border-l-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-900/10', word: 'text-blue-600 dark:text-blue-400', tag: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' };
  }
  if (m.includes('v.') || m.includes('动词')) {
    return { border: 'border-l-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', word: 'text-emerald-600 dark:text-emerald-400', tag: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' };
  }
  if (m.includes('adj') || m.includes('形容词')) {
    return { border: 'border-l-purple-500', bg: 'bg-purple-50/50 dark:bg-purple-900/10', word: 'text-purple-600 dark:text-purple-400', tag: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' };
  }
  return { border: 'border-l-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/10', word: 'text-amber-600 dark:text-amber-400', tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' };
};

const VocabCard = ({ vocab, onSave, topicTitle }) => {
  const colorScheme = getColorScheme(vocab.meaning);
  
  return (
    <div className={`p-3 ${colorScheme.bg} rounded-xl border-l-4 ${colorScheme.border} border border-slate-200 dark:border-slate-700`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold ${colorScheme.word}`}>{vocab.word}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorScheme.tag}`}>{vocab.meaning}</span>
          </div>
          {vocab.collocation && (
            <div className="mt-1 text-sm">
              <span className="text-slate-400">搭配: </span>
              <span className="text-slate-600 dark:text-slate-300">{vocab.collocation}</span>
            </div>
          )}
          {vocab.example && (
            <div className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 italic line-clamp-2">
              {vocab.example}
            </div>
          )}
        </div>
        <button 
          onClick={() => onSave({ ...vocab, sourceTopic: topicTitle, timestamp: Date.now() })} 
          className="flex-shrink-0 p-2 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

VocabCard.propTypes = {
  vocab: PropTypes.shape({
    word: PropTypes.string.isRequired,
    meaning: PropTypes.string,
    collocation: PropTypes.string,
    example: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  topicTitle: PropTypes.string,
};

export { VocabCard, getColorScheme };
export default VocabCard;