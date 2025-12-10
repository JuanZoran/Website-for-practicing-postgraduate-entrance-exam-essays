/**
 * LeanCloud 配置和初始化
 */
import { initLeanCloud } from '../services/leancloudService';

let isInitialized = false;

/**
 * 初始化 LeanCloud（安全模式）
 * @returns {boolean} 是否初始化成功
 */
export const initializeLeanCloud = () => {
  if (isInitialized) return true;
  
  try {
    const lcConfig = window.__leancloud_config;
    if (lcConfig && lcConfig.appId && lcConfig.appKey) {
      initLeanCloud(lcConfig.appId, lcConfig.appKey, lcConfig.serverURL);
      isInitialized = true;
      return true;
    } else {
      console.warn("LeanCloud 配置不完整，使用离线模式");
      return false;
    }
  } catch (e) {
    console.warn("LeanCloud init failed/skipped (Offline mode active):", e);
    return false;
  }
};

/**
 * 获取应用 ID
 */
export const getAppId = () => {
  return typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
};

/**
 * 检查 LeanCloud 是否已初始化
 */
export const isLeanCloudReady = () => isInitialized;

export default {
  initializeLeanCloud,
  getAppId,
  isLeanCloudReady
};
