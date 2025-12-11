const SimpleMarkdown = ({ text, className = "" }) => {
  if (!text) return null;
  
  // 格式化内联文本
  const formatInline = (str) => {
    if (!str) return null;
    
    // 使用更简单的方式：直接用 split 和 map 处理粗体
    const parts = [];
    let remaining = str;
    let keyIndex = 0;
    
    // 处理粗体 **text**
    while (remaining.length > 0) {
      const boldStart = remaining.indexOf('**');
      
      if (boldStart === -1) {
        // 没有更多粗体标记，添加剩余文本
        if (remaining) {
          parts.push({ type: 'text', content: remaining, key: keyIndex++ });
        }
        break;
      }
      
      // 添加粗体标记之前的文本
      if (boldStart > 0) {
        parts.push({ type: 'text', content: remaining.slice(0, boldStart), key: keyIndex++ });
      }
      
      // 查找结束的 **
      const afterStart = remaining.slice(boldStart + 2);
      const boldEnd = afterStart.indexOf('**');
      
      if (boldEnd === -1) {
        // 没有找到结束标记，把剩余的都当作普通文本
        parts.push({ type: 'text', content: remaining.slice(boldStart), key: keyIndex++ });
        break;
      }
      
      // 提取粗体内容
      const boldContent = afterStart.slice(0, boldEnd);
      if (boldContent) {
        parts.push({ type: 'bold', content: boldContent, key: keyIndex++ });
      }
      
      // 继续处理剩余文本
      remaining = afterStart.slice(boldEnd + 2);
    }
    
    // 渲染各部分
    return parts.map(part => {
      if (part.type === 'bold') {
        return (
          <strong 
            key={part.key} 
            className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-1 rounded"
          >
            {part.content}
          </strong>
        );
      }
      return <span key={part.key}>{part.content}</span>;
    });
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2"></div>;
        
        const trimmedLine = line.trim();
        
        // 检测标题 (### 或 ## 或 #)
        if (trimmedLine.startsWith('### ')) {
          return (
            <h4 key={i} className="font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1">
              {formatInline(trimmedLine.slice(4))}
            </h4>
          );
        }
        
        if (trimmedLine.startsWith('## ')) {
          return (
            <h3 key={i} className="font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2 text-lg">
              {formatInline(trimmedLine.slice(3))}
            </h3>
          );
        }
        
        // 检测列表项
        const isBullet = /^[-*•]\s/.test(trimmedLine);
        const isNumbered = /^\d+[.)]\s/.test(trimmedLine);
        
        if (isBullet) {
          const content = trimmedLine.replace(/^[-*•]\s/, '');
          return (
            <div key={i} className="flex gap-2 ml-1 leading-relaxed break-words">
              <span className="text-indigo-400 dark:text-indigo-500 mt-0.5 flex-shrink-0">•</span>
              <div className="flex-1">{formatInline(content)}</div>
            </div>
          );
        }
        
        if (isNumbered) {
          const num = trimmedLine.match(/^\d+/)[0];
          const content = trimmedLine.replace(/^\d+[.)]\s/, '');
          return (
            <div key={i} className="flex gap-2 ml-1 leading-relaxed break-words">
              <span className="text-emerald-500 dark:text-emerald-400 font-medium text-sm mt-0.5 flex-shrink-0 min-w-[1.5rem]">{num}.</span>
              <div className="flex-1">{formatInline(content)}</div>
            </div>
          );
        }
        
        return (
          <div key={i} className="leading-relaxed break-words">{formatInline(line)}</div>
        );
      })}
    </div>
  );
};

export default SimpleMarkdown;
