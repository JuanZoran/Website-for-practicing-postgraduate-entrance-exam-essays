import { useState, useEffect, useRef } from 'react';
import { Table as TableIcon, Upload } from 'lucide-react';

const QuestionVisualizer = ({ data }) => {
  const [imgSrc, setImgSrc] = useState(data.defaultImage);
  const fileInputRef = useRef(null);
  
  useEffect(() => { 
    setImgSrc(data.defaultImage); 
  }, [data]);
  
  const handleFileUpload = (e) => { 
    if(e.target.files[0]) setImgSrc(URL.createObjectURL(e.target.files[0])); 
  };

  if (data.visualType === "table") {
    return (
      <div className="card-breathe text-center h-full flex flex-col justify-center">
        <TableIcon className="w-8 h-8 mx-auto mb-3 text-indigo-500" />
        <p className="text-[15px] text-slate-600 dark:text-slate-300">{data.description}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative group h-full">
      <div className="flex items-center justify-center h-full min-h-[220px] p-4">
        <img 
          src={imgSrc} 
          alt="Exam" 
          className="max-w-full max-h-[50vh] object-contain rounded-2xl shadow-sm" 
          onError={(e) => {e.target.src="https://placehold.co/800x400?text=Image+Error"}} 
        />
      </div>
      {/* 上传按钮 - 更隐蔽 */}
      <button 
        onClick={() => fileInputRef.current?.click()} 
        className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity active:scale-95"
      >
        <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
      </button>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
    </div>
  );
};

export default QuestionVisualizer;