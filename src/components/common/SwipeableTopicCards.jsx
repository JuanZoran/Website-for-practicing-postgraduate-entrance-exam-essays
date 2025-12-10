/**
 * 可滑动的题目卡片组件
 * Jobs 风格的卡片轮播
 */
import { useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';

const SwipeableTopicCards = ({ list, currentIdx, onSelect, onGenerate }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const containerRef = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && currentIdx < list.length - 1) onSelect(currentIdx + 1);
    if (distance < -minSwipeDistance && currentIdx > 0) onSelect(currentIdx - 1);
  };

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {list.map((item, i) => (
            <div key={i} className="w-full flex-shrink-0 px-1">
              <div
                className={`p-6 rounded-3xl transition-all duration-300 ${
                  currentIdx === i
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className={`text-sm ${currentIdx === i ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {item.year}
                </span>
                <h3 className={`text-xl font-semibold mt-1 ${currentIdx === i ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.title}
                </h3>
                <p className={`text-sm mt-2 line-clamp-2 ${currentIdx === i ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 指示器 */}
      <div className="flex justify-center gap-2 mt-6">
        {list.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`rounded-full transition-all duration-500 ${
              i === currentIdx 
                ? 'w-8 h-2 bg-indigo-600' 
                : 'w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
      
      {/* AI出题按钮 */}
      <button 
        onClick={onGenerate}
        className="w-full mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-400 flex items-center justify-center gap-3 font-medium active:scale-[0.98] transition-transform"
      >
        <Sparkles className="w-5 h-5" />
        <span>AI 智能出题</span>
      </button>
    </div>
  );
};

export default SwipeableTopicCards;
