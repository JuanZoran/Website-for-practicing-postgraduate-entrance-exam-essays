import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  saveUserData, 
  getUserData, 
  subscribeUserData 
} from "../services/leancloudService";
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, isAnonymous, isLeanCloudEnabled } = useAuth();
  
  const [vocab, setVocab] = useState([]);
  const [errors, setErrors] = useState([]);
  const [history, setHistory] = useState({});
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDark(true);
    }
    const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
    const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
    setVocab(localVocab);
    setErrors(localErrors);
  }, []);

  useEffect(() => {
    if (!user || !isLeanCloudEnabled || isAnonymous) {
      const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
      const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
      const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
      setVocab(localVocab);
      setErrors(localErrors);
      setHistory(localHistory);
      return;
    }

    const userId = user.uid;

    const loadData = async () => {
      try {
        const notebookData = await getUserData(userId, 'notebook');
        if (notebookData) {
          const cloudVocab = notebookData.vocab || [];
          const cloudErrors = notebookData.errors || [];
          setVocab(cloudVocab);
          setErrors(cloudErrors);
          localStorage.setItem('kaoyan_vocab', JSON.stringify(cloudVocab));
          localStorage.setItem('kaoyan_errors', JSON.stringify(cloudErrors));
        } else {
          const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
          const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
          if (localVocab.length > 0 || localErrors.length > 0) {
            await saveUserData(userId, 'notebook', { vocab: localVocab, errors: localErrors });
          }
        }
      } catch (err) {
        console.warn("加载笔记本数据失败:", err);
        const localVocab = JSON.parse(localStorage.getItem('kaoyan_vocab') || '[]');
        const localErrors = JSON.parse(localStorage.getItem('kaoyan_errors') || '[]');
        setVocab(localVocab);
        setErrors(localErrors);
      }

      try {
        const historyData = await getUserData(userId, 'history');
        if (historyData) {
          const cloudHistory = historyData.records || {};
          setHistory(cloudHistory);
          localStorage.setItem('kaoyan_history', JSON.stringify(cloudHistory));
        } else {
          const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
          if (Object.keys(localHistory).length > 0) {
            await saveUserData(userId, 'history', { records: localHistory });
          }
        }
      } catch (err) {
        console.warn("加载历史数据失败:", err);
        const localHistory = JSON.parse(localStorage.getItem('kaoyan_history') || '{}');
        setHistory(localHistory);
      }
    };

    loadData();

    const unsubNotebook = subscribeUserData(userId, 'notebook', (data) => {
      if (data) {
        setVocab(data.vocab || []);
        setErrors(data.errors || []);
        localStorage.setItem('kaoyan_vocab', JSON.stringify(data.vocab || []));
        localStorage.setItem('kaoyan_errors', JSON.stringify(data.errors || []));
      }
    });

    const unsubHistory = subscribeUserData(userId, 'history', (data) => {
      if (data) {
        setHistory(data.records || {});
        localStorage.setItem('kaoyan_history', JSON.stringify(data.records || {}));
      }
    });

    return () => {
      unsubNotebook();
      unsubHistory();
    };
  }, [user, isAnonymous, isLeanCloudEnabled]);

  const saveData = useCallback((v, e) => {
    setVocab(v);
    setErrors(e);
    localStorage.setItem('kaoyan_vocab', JSON.stringify(v));
    localStorage.setItem('kaoyan_errors', JSON.stringify(e));
    if (user && isLeanCloudEnabled && !isAnonymous) {
      saveUserData(user.uid, 'notebook', { vocab: v, errors: e })
        .catch(err => console.warn("Cloud save failed:", err));
    }
  }, [user, isLeanCloudEnabled, isAnonymous]);

  const saveHistory = useCallback((topicId, record) => {
    const newHistory = { ...history, [topicId]: [...(history[topicId] || []), record] };
    setHistory(newHistory);
    localStorage.setItem('kaoyan_history', JSON.stringify(newHistory));
    if (user && isLeanCloudEnabled && !isAnonymous) {
      saveUserData(user.uid, 'history', { records: newHistory })
        .catch(err => console.warn("History save failed:", err));
    }
  }, [user, isLeanCloudEnabled, isAnonymous, history]);

  const addVocab = useCallback((v) => {
    if (!vocab.some(x => x.word === v.word)) {
      saveData([v, ...vocab], errors);
    }
  }, [vocab, errors, saveData]);

  const addError = useCallback((e) => {
    saveData(vocab, [e, ...errors]);
  }, [vocab, errors, saveData]);

  const removeVocab = useCallback((i) => {
    saveData(vocab.filter((_, x) => x !== i), errors);
  }, [vocab, errors, saveData]);

  const removeError = useCallback((i) => {
    saveData(vocab, errors.filter((_, x) => x !== i));
  }, [vocab, errors, saveData]);

  const toggleDark = useCallback(() => setDark(d => !d), []);

  const handleExportData = useCallback(() => {
    const dataStr = JSON.stringify({ savedVocab: vocab, savedErrors: errors }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kaoyan_notebook_backup.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [vocab, errors]);

  const handleImportData = useCallback((data) => {
    let newVocab = vocab;
    let newErrors = errors;
    if (data.savedVocab && Array.isArray(data.savedVocab)) {
      const existingWords = new Set(vocab.map(v => v.word));
      const toAdd = data.savedVocab.filter(v => !existingWords.has(v.word));
      newVocab = [...toAdd, ...vocab];
    }
    if (data.savedErrors && Array.isArray(data.savedErrors)) {
      newErrors = [...data.savedErrors, ...errors];
    }
    saveData(newVocab, newErrors);
    alert("数据已导入并尝试同步至云端！");
  }, [vocab, errors, saveData]);

  const value = {
    vocab,
    errors,
    history,
    dark,
    saveData,
    saveHistory,
    addVocab,
    addError,
    removeVocab,
    removeError,
    toggleDark,
    handleExportData,
    handleImportData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
