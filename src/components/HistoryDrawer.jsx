import { Clock } from 'lucide-react';

const HistoryDrawer = ({ isOpen, onClose, history, topicTitle }) => {
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 animate-fadeIn" onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-out z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        {/* 头部 */}
        <div className="px-6 py-4 glass border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
          <h3 className="font-semibold text-[17px] text-slate-800 dark:text-slate-100">练习历史</h3>
          <button onClick={onClose} className="touch-target text-indigo-600 font-medium active:scale-95 transition-transform">
            完成
          </button>
        </div>
        
        {/* 当前题目 */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[13px] text-slate-400">当前题目</span>
          <p className="text-[15px] text-slate-700 dark:text-slate-200 font-medium">{topicTitle}</p>
        </div>
        
        {/* 历史列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!history || history.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-200 dark:text-slate-700" />
              <p className="text-[15px] text-slate-400">暂无练习记录</p>
            </div>
          ) : (
            history.slice().reverse().map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[13px] font-medium px-3 py-1 rounded-full ${
                    item.type === 'logic' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                    item.type === 'grammar' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                  }`}>
                    {item.type === 'logic' ? '审题' : item.type === 'grammar' ? '润色' : '阅卷'}
                  </span>
                  <span className="text-[12px] text-slate-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[15px] text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
                  {item.input}
                </p>
                {item.feedback?.comment && (
                  <p className="text-[13px] text-slate-400 line-clamp-1">
                    AI: {item.feedback.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryDrawer;
