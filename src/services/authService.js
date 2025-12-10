/**
 * 认证服务层
 * 封装用户名+密码登录逻辑
 * 使用 LeanCloud 用户系统
 */

import {
  registerWithUsername as lcRegister,
  loginWithUsername as lcLogin,
  signOutUser as lcSignOut,
  getCurrentUsername as lcGetCurrentUsername,
  onAuthStateChange as lcOnAuthStateChange,
  migrateAnonymousData as lcMigrateAnonymousData
} from './leancloudService';

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: "用户名不能为空" };
  }
  if (username.length < 3) {
    return { valid: false, error: "用户名至少需要3个字符" };
  }
  if (username.length > 20) {
    return { valid: false, error: "用户名不能超过20个字符" };
  }
  // 只允许字母、数字、下划线
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: "用户名只能包含字母、数字和下划线" };
  }
  return { valid: true };
};

/**
 * 验证密码格式
 * @param {string} password - 密码
 * @returns {object} { valid: boolean, error?: string }
 */
export const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return { valid: false, error: "密码不能为空" };
  }
  if (password.length < 6) {
    return { valid: false, error: "密码至少需要6个字符" };
  }
  return { valid: true };
};

/**
 * 检查用户名是否已存在（LeanCloud 会自动检查，此函数保留接口兼容性）
 * @param {object} lc - LeanCloud 实例（保留参数以兼容接口）
 * @param {string} username - 用户名
 * @returns {Promise<boolean>} 是否存在
 */
export const checkUsernameExists = async (lc, username) => {
  // LeanCloud 在注册时会自动检查用户名是否存在
  // 此函数保留以兼容现有接口，但实际不需要
  return false;
};

/**
 * 使用用户名和密码注册新用户
 * @param {object} lc - LeanCloud 实例（保留参数以兼容接口，实际不使用）
 * @param {object} db - 数据库实例（保留参数以兼容接口，实际不使用）
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
export const registerWithUsername = async (lc, db, username, password) => {
  // 验证用户名
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return { success: false, error: usernameValidation.error };
  }

  // 验证密码
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  // 调用 LeanCloud 注册
  return await lcRegister(username, password);
};

/**
 * 使用用户名和密码登录
 * @param {object} lc - LeanCloud 实例（保留参数以兼容接口，实际不使用）
 * @param {object} db - 数据库实例（保留参数以兼容接口，实际不使用）
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
export const loginWithUsername = async (lc, db, username, password) => {
  // 验证输入
  if (!username || !password) {
    return { success: false, error: "请输入用户名和密码" };
  }

  // 调用 LeanCloud 登录
  return await lcLogin(username, password);
};

/**
 * 登出
 * @param {object} lc - LeanCloud 实例（保留参数以兼容接口，实际不使用）
 * @returns {Promise<void>}
 */
export const signOutUser = async (lc) => {
  return await lcSignOut();
};

/**
 * 获取当前登录用户的用户名
 * @param {object} db - 数据库实例（保留参数以兼容接口，实际不使用）
 * @param {string} uid - 用户ID（保留参数以兼容接口，实际不使用）
 * @returns {Promise<string|null>} 用户名
 */
export const getCurrentUsername = async (db, uid) => {
  // 直接返回 LeanCloud 的用户名
  return lcGetCurrentUsername();
};

/**
 * 迁移匿名用户数据到正式账号
 * @param {object} db - 数据库实例（保留参数以兼容接口，实际不使用）
 * @param {string} appId - 应用ID（保留参数以兼容接口，实际不使用）
 * @param {string} uid - 正式账号的用户ID
 * @param {object} anonymousData - 匿名用户数据 { vocab, errors, history }
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
export const migrateAnonymousData = async (db, appId, uid, anonymousData) => {
  return await lcMigrateAnonymousData(uid, anonymousData);
};

/**
 * 监听认证状态变化
 * @param {object} lc - LeanCloud 实例（保留参数以兼容接口，实际不使用）
 * @param {function} callback - 回调函数
 * @returns {function} 取消监听的函数
 */
export const onAuthStateChange = (lc, callback) => {
  return lcOnAuthStateChange(callback);
};
