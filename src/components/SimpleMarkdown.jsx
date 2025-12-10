const SimpleMarkdown = ({ text, className = "" }) => {
  if (!text) return null;
  
  // 格式化内联文本，支持更丰富的颜色
  const formatInline = (str) => {
    const elements = [];
    let lastIndex = 0;
    const matches = [];
    
    // 匹配粗体 **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(str)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'bold' });
    }
    
    // 匹配引号内容 "text"
    const quoteRegex = /"([^"]+)"/g;
    while ((match = quoteRegex.exec(str)) !== null) {
      const overlaps = matches.some(m => 
        (match.index >= m.start && match.index < m.end) || 
        (match.index + match[0].length > m.start && match.index + match[0].length <= m.end)
      );
      if (!overlaps) {
        matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'quote' });
      }
    }
    
    // 匹配英文单词/短语（用于高亮关键术语）
    const termRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    while ((match = termRegex.exec(str)) !== null) {
      const overlaps = matches.some(m => 
        (match.index >= m.start && match.index < m.end) || 
        (match.index + match[0].length > m.start && match.index + match[0].length <= m.end)
      );
      if (!overlaps && match[1].length > 3) {
        matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'term' });
      }
    }
    
    // 按位置排序
    matches.sort((a, b) => a.start - b.start);
    
    // 构建结果
    matches.forEach((m, idx) => {
      if (m.start > lastIndex) {
        elements.push(<span key={`t${idx}`}>{str.slice(lastIndex, m.start)}</span>);
      }
      if (m.type === 'bold') {
        elements.push(
          <strong key={`b${idx}`} className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-1 rounded">
            {m.content}
          </strong>
        );
      } else if (m.type === 'quote') {
        elements.push(
          <span key={`q${idx}`} className="text-emerald-600 dark:text-emerald-400 font-medium">"{m.content}"</span>
        );
      } else if (m.type === 'term') {
        elements.push(
          <span key={`e${idx}`} className="text-blue-600 dark:text-blue-400 font-medium">{m.content}</span>
        );
      }
      lastIndex = m.end;
    });
    
    if (lastIndex < str.length) {
      elements.push(<span key="last">{str.slice(lastIndex)}</span>);
    }
    
    return elements.length > 0 ? elements : str;
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2"></div>;
        
        // 检测列表项
        const isBullet = /^[-*•]\s/.test(line.trim());
        const isNumbered = /^\d+[.)]\s/.test(line.trim());
        const cleanLine = isBullet ? line.trim().substring(2) : 
                         isNumbered ? line.trim().replace(/^\d+[.)]\s/, '') : line;
        
        const formattedContent = formatInline(cleanLine);
        
        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 ml-1 leading-relaxed break-words">
              <span className="text-indigo-400 dark:text-indigo-500 mt-0.5 flex-shrink-0">•</span>
              <div className="flex-1">{formattedContent}</div>
            </div>
          );
        }
        
        if (isNumbered) {
          const num = line.trim().match(/^\d+/)[0];
          return (
            <div key={i} className="flex gap-2 ml-1 leading-relaxed break-words">
              <span className="text-emerald-500 dark:text-emerald-400 font-medium text-sm mt-0.5 flex-shrink-0 min-w-[1.5rem]">{num}.</span>
              <div className="flex-1">{formattedContent}</div>
            </div>
          );
        }
        
        return (
          <div key={i} className="leading-relaxed break-words">{formattedContent}</div>
        );
      })}
    </div>
  );
};

export default SimpleMarkdown;
