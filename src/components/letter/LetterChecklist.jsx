import { CheckSquare } from 'lucide-react';

const CHECKLIST_ITEMS = [
  { key: 'tense', label: '时态一致性', hint: '过去事件用过去时，将来期待用将来时' },
  { key: 'agreement', label: '主谓一致', hint: '第三人称单数是否加了 s' },
  { key: 'spelling', label: '拼写一致', hint: 'Apologize/Apologise 全文统一' },
  { key: 'signOff', label: '落款逗号', hint: 'Yours sincerely 后是否有逗号' },
  { key: 'points', label: '信息点覆盖', hint: '题目要求的要点是否都提到' },
];

const LetterChecklist = ({ checklist, onChange }) => {
  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
      <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
        <CheckSquare className="w-4 h-4" />
        交卷前检查清单
      </h4>
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={!!checklist?.[item.key]}
              onChange={(e) => onChange(item.key, e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span
                className={`font-medium text-sm ${
                  checklist?.[item.key] ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.label}
              </span>
              <p className="text-xs text-slate-500">{item.hint}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LetterChecklist;

