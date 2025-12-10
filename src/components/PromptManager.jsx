import { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, Check, Edit2, Copy, Download, Upload, ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react';
import {
  getAllTemplates,
  getTemplatesByType,
  getActiveTemplates,
  setActiveTemplate,
  saveTemplate,
  deleteTemplate,
  getTypeName,
  exportTemplates,
  importTemplates,
  SCORING_CRITERIA
} from '../services/promptService';

const PromptManager = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedType, setSelectedType] = useState('logic');
  const [templates, setTemplates] = useState([]);
  const [activeTemplates, setActiveTemplatesState] = useState({});
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [showCriteria, setShowCriteria] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTemplates(getTemplatesByType(selectedType));
    }
  }, [selectedType, isOpen]);

  const refreshData = () => {
    setTemplates(getTemplatesByType(selectedType));
    setActiveTemplatesState(getActiveTemplates());
  };

  const handleSetActive = (templateId) => {
    setActiveTemplate(selectedType, templateId);
    setActiveTemplatesState(getActiveTemplates());
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    saveTemplate(editingTemplate);
    setEditingTemplate(null);
    refreshData();
  };

  const handleDeleteTemplate = (templateId) => {
    if (confirm('确定要删除这个模板吗？')) {
      try {
        deleteTemplate(templateId);
        refreshData();
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({
      id: '',
      name: '新模板',
      type: selectedType,
      description: '',
      template: '',
      fewShotExamples: []
    });
  };

  const handleDuplicateTemplate = (template) => {
    setEditingTemplate({
      ...template,
      id: '',
      name: `${template.name} (副本)`,
      isDefault: false
    });
  };

  const handleExport = () => {
    const data = exportTemplates();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompt_templates.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (importTemplates(event.target.result)) {
          alert('模板导入成功');
          refreshData();
        } else {
          alert('模板导入失败');
        }
      };
      reader.readAsText(file);
    }
  };

  const addFewShotExample = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      fewShotExamples: [
        ...(editingTemplate.fewShotExamples || []),
        { input: '', output: '' }
      ]
    });
  };

  const updateFewShotExample = (index, field, value) => {
    if (!editingTemplate) return;
    const examples = [...(editingTemplate.fewShotExamples || [])];
    examples[index] = { ...examples[index], [field]: value };
    setEditingTemplate({ ...editingTemplate, fewShotExamples: examples });
  };

  const removeFewShotExample = (index) => {
    if (!editingTemplate) return;
    const examples = [...(editingTemplate.fewShotExamples || [])];
    examples.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, fewShotExamples: examples });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-xl w-full max-w-lg md:max-w-3xl h-[90vh] md:h-auto md:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-lg dark:text-white">提示词管理</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex px-4 py-2 gap-2 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('templates')} 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'templates' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            模板管理
          </button>
          <button 
            onClick={() => setActiveTab('criteria')} 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'criteria' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            评分标准
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'templates' && !editingTemplate && (
            <div className="space-y-4 animate-fadeIn">
              {/* 类型选择 */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['logic', 'grammar', 'scoring', 'vocab'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      selectedType === type
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {getTypeName(type)}
                  </button>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新建模板
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  导入
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>

              {/* 模板列表 */}
              <div className="space-y-3">
                {templates.map(template => (
                  <div 
                    key={template.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      activeTemplates[selectedType] === template.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-800 dark:text-slate-200">{template.name}</h4>
                          {template.isDefault && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-full">默认</span>
                          )}
                          {activeTemplates[selectedType] === template.id && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              使用中
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                      </div>
                      <button
                        onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {expandedTemplate === template.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* 展开的详情 */}
                    {expandedTemplate === template.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">提示词模板</div>
                          <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-xl overflow-x-auto max-h-40 text-slate-600 dark:text-slate-400">
                            {template.template}
                          </pre>
                        </div>
                        {template.fewShotExamples?.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Few-shot 示例 ({template.fewShotExamples.length})</div>
                            <div className="text-xs text-slate-400">包含 {template.fewShotExamples.length} 个示例用于提升准确性</div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleSetActive(template.id)}
                            disabled={activeTemplates[selectedType] === template.id}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                              activeTemplates[selectedType] === template.id
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {activeTemplates[selectedType] === template.id ? '已启用' : '启用此模板'}
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600"
                            title="复制"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {!template.isDefault && (
                            <>
                              <button
                                onClick={() => setEditingTemplate(template)}
                                className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600"
                                title="编辑"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 编辑模板 */}
          {activeTab === 'templates' && editingTemplate && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-800 dark:text-slate-200">
                  {editingTemplate.id ? '编辑模板' : '新建模板'}
                </h4>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  取消
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">模板名称</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">描述</label>
                <input
                  type="text"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  提示词模板
                  <span className="text-xs text-slate-400 ml-2">支持变量: {'{{topic}}'}, {'{{description}}'}, {'{{userInput}}'} 等</span>
                </label>
                <textarea
                  value={editingTemplate.template}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, template: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>

              {/* Few-shot 示例 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Few-shot 示例
                    <span className="text-xs text-slate-400 ml-2">提供示例可提升 AI 准确性</span>
                  </label>
                  <button
                    onClick={addFewShotExample}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加示例
                  </button>
                </div>
                <div className="space-y-3">
                  {(editingTemplate.fewShotExamples || []).map((example, index) => (
                    <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">示例 {index + 1}</span>
                        <button
                          onClick={() => removeFewShotExample(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">输入</label>
                        <textarea
                          value={example.input}
                          onChange={(e) => updateFewShotExample(index, 'input', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">期望输出 (JSON)</label>
                        <textarea
                          value={example.output}
                          onChange={(e) => updateFewShotExample(index, 'output', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveTemplate}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                保存模板
              </button>
            </div>
          )}

          {/* 评分标准 */}
          {activeTab === 'criteria' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-medium text-indigo-800 dark:text-indigo-200">考研英语作文评分标准</h4>
                </div>
                <p className="text-sm text-indigo-600 dark:text-indigo-300">
                  以下是考研英语作文的官方评分维度和标准，已内置于评分模板中。
                </p>
              </div>

              {Object.entries(SCORING_CRITERIA).map(([key, criterion]) => (
                <div key={key} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-slate-800 dark:text-slate-200">{criterion.name}</h5>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">权重: {criterion.weight * 100}%</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(criterion.levels).map(([level, desc]) => (
                      <div key={level} className="flex gap-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          level === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                          level === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                          level === 'fair' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                        }`}>
                          {level === 'excellent' ? '优秀' : level === 'good' ? '良好' : level === 'fair' ? '一般' : '较差'}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* 分数档次说明 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <h5 className="font-medium text-slate-800 dark:text-slate-200 mb-3">分数档次 (满分20分)</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">第一档 (17-20分)</span>
                    <span className="text-slate-500">优秀</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">第二档 (13-16分)</span>
                    <span className="text-slate-500">良好</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600 dark:text-amber-400">第三档 (9-12分)</span>
                    <span className="text-slate-500">一般</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600 dark:text-orange-400">第四档 (5-8分)</span>
                    <span className="text-slate-500">较差</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">第五档 (1-4分)</span>
                    <span className="text-slate-500">很差</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptManager;
