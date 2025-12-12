import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signOutUser, 
  getCurrentUsername, 
  migrateAnonymousData,
  onAuthStateChange as onAuthStateChangeService
} from "../services/authService";
import { initLeanCloud } from "../services/leancloudService";

const AuthContext = createContext(null);

let leanCloudInitialized = false;
let appIdValue = 'default-app-id';

try {
  const lcConfig = window.__leancloud_config;
  if (lcConfig?.appId && lcConfig?.appKey) {
    initLeanCloud(lcConfig.appId, lcConfig.appKey, lcConfig.serverURL);
    leanCloudInitialized = true;
  }
  appIdValue = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (e) {
  console.warn("LeanCloud init failed:", e);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [authModal, setAuthModal] = useState(false);

  const isLeanCloudEnabled = leanCloudInitialized;
  const appId = appIdValue;

  useEffect(() => {
    if (!isLeanCloudEnabled) return;

    const unsubscribe = onAuthStateChangeService(null, async (lcUser) => {
      if (lcUser) {
        setUser(lcUser);
        setIsAnonymous(false);
        const currentUsername = await getCurrentUsername(null, lcUser.uid);
        setUsername(currentUsername);
      } else {
        setUser(null);
        setUsername(null);
        setIsAnonymous(false);
      }
    });

    return () => unsubscribe();
  }, [isLeanCloudEnabled]);

  const handleLoginSuccess = useCallback(async (newUser, localData) => {
    if (!newUser || !isLeanCloudEnabled) return;

    const hasLocalData = localData && (
      localData.vocab?.length > 0 || 
      localData.errors?.length > 0 || 
      Object.keys(localData.history || {}).length > 0
    );

    if (hasLocalData && isAnonymous) {
      setMigrating(true);
      try {
        const anonymousData = { 
          vocab: localData.vocab, 
          errors: localData.errors, 
          history: localData.history 
        };
        const result = await migrateAnonymousData(null, appId, newUser.uid, anonymousData);
        if (result.success) {
          localStorage.removeItem('kaoyan_vocab');
          localStorage.removeItem('kaoyan_errors');
          localStorage.removeItem('kaoyan_history');
        }
      } catch (error) {
        console.error("数据迁移错误:", error);
      } finally {
        setMigrating(false);
      }
    }

    const currentUsername = await getCurrentUsername(null, newUser.uid);
    setUsername(currentUsername);
    setIsAnonymous(false);
    setUser(newUser);
  }, [isLeanCloudEnabled, isAnonymous, appId]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser(null);
      setUser(null);
      setUsername(null);
      setIsAnonymous(false);
    } catch (error) {
      console.error("登出失败:", error);
    }
  }, []);

  const openAuthModal = useCallback(() => setAuthModal(true), []);
  const closeAuthModal = useCallback(() => setAuthModal(false), []);

  const value = {
    user,
    username,
    isAnonymous,
    migrating,
    authModal,
    isLeanCloudEnabled,
    handleLoginSuccess,
    handleSignOut,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
