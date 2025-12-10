/**
 * LeanCloud 服务层
 * 替代 Firebase，提供数据存储和用户认证功能
 */

import AV from 'leancloud-storage';

let initialized = false;

/**
 * 初始化 LeanCloud
 * @param {string} appId - LeanCloud 应用 ID
 * @param {string} appKey - LeanCloud 应用 Key
 * @param {string} serverURL - LeanCloud 服务器地址（可选，默认使用国内版）
 */
export const initLeanCloud = (appId, appKey, serverURL = null) => {
  if (initialized) return;
  
  if (!appId || !appKey) {
    console.warn("LeanCloud 配置不完整，跳过初始化");
    return;
  }

  try {
    const config = {
      appId: appId,
      appKey: appKey
    };
    
    // 如果提供了 serverURL，则使用；否则使用默认的国内版格式
    if (serverURL) {
      config.serverURL = serverURL;
    } else {
      // 国内版默认格式：https://{appId前8位}.lc-cn-n1-shared.com
      // 注意：这只是一个示例，实际应该从配置中获取
      config.serverURL = `https://${appId.slice(0, 8)}.lc-cn-n1-shared.com`;
    }
    
    AV.init(config);
    
    initialized = true;
    console.log("LeanCloud 初始化成功");
  } catch (error) {
    console.error("LeanCloud 初始化失败:", error);
    initialized = false;
  }
};

/**
 * 用户注册
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
export const registerWithUsername = async (username, password) => {
  if (!initialized) {
    return { success: false, error: "LeanCloud 未初始化" };
  }

  try {
    // 直接创建新用户，LeanCloud 会自动检查用户名是否已存在
    const user = new AV.User();
    user.setUsername(username.toLowerCase());
    user.setPassword(password);
    // 注意：不在注册时设置 displayName，因为 _User class 默认不允许添加新字段
    // 显示名称会从 username 获取（在 getCurrentUsername 中有 fallback 逻辑）
    
    await user.signUp();
    
    return { success: true, user: userToJSON(user) };
  } catch (error) {
    console.error('注册失败:', error);
    let errorMessage = '注册失败，请稍后重试';
    
    if (error.code === 202) {
      errorMessage = '用户名已被使用';
    } else if (error.code === 125) {
      errorMessage = '邮箱格式不正确';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
export const loginWithUsername = async (username, password) => {
  if (!initialized) {
    return { success: false, error: "LeanCloud 未初始化" };
  }

  try {
    const user = await AV.User.logIn(username.toLowerCase(), password);
    return { success: true, user: userToJSON(user) };
  } catch (error) {
    console.error('登录失败:', error);
    let errorMessage = '登录失败，请稍后重试';
    
    if (error.code === 210) {
      errorMessage = '用户名或密码错误';
    } else if (error.code === 211) {
      errorMessage = '用户不存在';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * 用户登出
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  if (!initialized) return;
  try {
    await AV.User.logOut();
  } catch (error) {
    console.error('登出失败:', error);
    throw error;
  }
};

/**
 * 获取当前用户
 * @returns {object|null} 用户对象（JSON格式）
 */
export const getCurrentUser = () => {
  if (!initialized) return null;
  const user = AV.User.current();
  return user ? userToJSON(user) : null;
};

/**
 * 获取当前用户名
 * @returns {string|null}
 */
export const getCurrentUsername = () => {
  if (!initialized) return null;
  const user = AV.User.current();
  if (user) {
    return user.get('displayName') || user.getUsername();
  }
  return null;
};

/**
 * 监听认证状态变化
 * @param {function} callback - 回调函数 (user) => void
 * @returns {function} 取消监听的函数
 */
export const onAuthStateChange = (callback) => {
  if (!initialized) {
    callback(null);
    return () => {};
  }

  // LeanCloud 没有内置的监听器，需要手动检查
  const checkAuth = () => {
    const user = AV.User.current();
    callback(user ? userToJSON(user) : null);
  };
  
  // 立即检查一次
  checkAuth();
  
  // 定期检查（每5秒）
  const interval = setInterval(checkAuth, 5000);
  
  // 返回取消函数
  return () => clearInterval(interval);
};

/**
 * 保存用户数据到 LeanCloud
 * @param {string} userId - 用户ID
 * @param {string} dataType - 数据类型 ('notebook' | 'history')
 * @param {object} data - 要保存的数据
 * @returns {Promise<void>}
 */
export const saveUserData = async (userId, dataType, data) => {
  if (!initialized) {
    throw new Error("LeanCloud 未初始化");
  }

  try {
    const UserData = AV.Object.extend('UserData');
    const query = new AV.Query('UserData');
    query.equalTo('userId', userId);
    query.equalTo('dataType', dataType);
    
    let userDataObj = await query.first();
    
    if (!userDataObj) {
      userDataObj = new UserData();
      userDataObj.set('userId', userId);
      userDataObj.set('dataType', dataType);
    }
    
    // 根据数据类型保存不同的字段
    if (dataType === 'notebook') {
      userDataObj.set('vocab', data.vocab || []);
      userDataObj.set('errors', data.errors || []);
    } else if (dataType === 'history') {
      userDataObj.set('records', data.records || {});
    }
    
    await userDataObj.save();
  } catch (error) {
    console.error('保存数据失败:', error);
    throw error;
  }
};

/**
 * 获取用户数据
 * @param {string} userId - 用户ID
 * @param {string} dataType - 数据类型 ('notebook' | 'history')
 * @returns {Promise<object|null>}
 */
export const getUserData = async (userId, dataType) => {
  if (!initialized) {
    return null;
  }

  try {
    const query = new AV.Query('UserData');
    query.equalTo('userId', userId);
    query.equalTo('dataType', dataType);
    
    const userDataObj = await query.first();
    
    if (!userDataObj) {
      return null;
    }
    
    if (dataType === 'notebook') {
      return {
        vocab: userDataObj.get('vocab') || [],
        errors: userDataObj.get('errors') || []
      };
    } else if (dataType === 'history') {
      return {
        records: userDataObj.get('records') || {}
      };
    }
    
    return null;
  } catch (error) {
    console.error('获取数据失败:', error);
    return null;
  }
};

/**
 * 监听用户数据变化（使用轮询方式）
 * @param {string} userId - 用户ID
 * @param {string} dataType - 数据类型
 * @param {function} callback - 回调函数
 * @returns {function} 取消监听的函数
 */
export const subscribeUserData = (userId, dataType, callback) => {
  if (!initialized) {
    return () => {};
  }

  let lastUpdate = Date.now();
  
  const poll = async () => {
    try {
      const data = await getUserData(userId, dataType);
      if (data) {
        callback(data);
      }
    } catch (error) {
      console.error('轮询数据失败:', error);
    }
  };
  
  // 立即获取一次
  poll();
  
  // 每10秒轮询一次
  const interval = setInterval(poll, 10000);
  
  return () => clearInterval(interval);
};

/**
 * 迁移匿名数据到正式账号
 * @param {string} userId - 正式账号的用户ID
 * @param {object} anonymousData - 匿名用户数据
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
export const migrateAnonymousData = async (userId, anonymousData) => {
  if (!initialized) {
    return { success: false, error: "LeanCloud 未初始化" };
  }

  try {
    // 获取现有数据
    const existingNotebook = await getUserData(userId, 'notebook') || { vocab: [], errors: [] };
    const existingHistory = await getUserData(userId, 'history') || { records: {} };
    
    // 合并词汇数据（去重）
    const existingWords = new Set(existingNotebook.vocab.map(v => v.word));
    const newVocab = [
      ...anonymousData.vocab.filter(v => !existingWords.has(v.word)),
      ...existingNotebook.vocab
    ];
    
    // 合并错题数据
    const newErrors = [...anonymousData.errors, ...existingNotebook.errors];
    
    // 合并历史记录
    const newHistory = { ...existingHistory.records };
    Object.keys(anonymousData.history || {}).forEach(topicId => {
      const existingRecords = newHistory[topicId] || [];
      const anonymousRecords = anonymousData.history[topicId] || [];
      newHistory[topicId] = [...anonymousRecords, ...existingRecords];
    });
    
    // 保存合并后的数据
    await Promise.all([
      saveUserData(userId, 'notebook', { vocab: newVocab, errors: newErrors }),
      saveUserData(userId, 'history', { records: newHistory })
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('数据迁移失败:', error);
    return { success: false, error: '数据迁移失败: ' + error.message };
  }
};

/**
 * 将 AV.User 对象转换为 JSON 格式（兼容 Firebase 格式）
 * @param {AV.User} user - LeanCloud 用户对象
 * @returns {object} 用户 JSON 对象
 */
const userToJSON = (user) => {
  if (!user) return null;
  
  return {
    uid: user.id,
    email: user.getEmail(),
    username: user.getUsername(),
    displayName: user.get('displayName') || user.getUsername(),
    isAnonymous: false, // LeanCloud 不支持匿名用户
    // 添加其他需要的字段
    ...user.toJSON()
  };
};

