/**
 * 认证服务层
 * 封装用户名+密码登录逻辑
 * 使用Firebase Email/Password认证，但通过Firestore存储用户名映射
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const EMAIL_DOMAIN = "@kaoyan-master.local";

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
 * 检查用户名是否已存在
 * @param {object} db - Firestore实例
 * @param {string} username - 用户名
 * @returns {Promise<boolean>} 是否存在
 */
export const checkUsernameExists = async (db, username) => {
  if (!db) return false;
  try {
    const usernameRef = doc(db, "usernames", username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    return usernameDoc.exists();
  } catch (error) {
    console.error("检查用户名失败:", error);
    return false;
  }
};

/**
 * 使用用户名和密码注册新用户
 * @param {object} auth - Firebase Auth实例
 * @param {object} db - Firestore实例
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
export const registerWithUsername = async (auth, db, username, password) => {
  if (!auth || !db) {
    return { success: false, error: "Firebase未初始化" };
  }

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

  try {
    // 检查用户名是否已存在
    const usernameLower = username.toLowerCase();
    const exists = await checkUsernameExists(db, usernameLower);
    if (exists) {
      return { success: false, error: "用户名已被使用" };
    }

    // 生成邮箱格式
    const email = `${usernameLower}${EMAIL_DOMAIN}`;

    // 创建Firebase账号
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 保存用户名映射
    const usernameRef = doc(db, "usernames", usernameLower);
    await setDoc(usernameRef, {
      uid: user.uid,
      createdAt: serverTimestamp()
    });

    // 保存用户资料
    const profileRef = doc(db, "users", user.uid, "profile", "info");
    await setDoc(profileRef, {
      username: username,
      createdAt: serverTimestamp()
    });

    return { success: true, user };
  } catch (error) {
    console.error("注册失败:", error);
    let errorMessage = "注册失败，请稍后重试";
    
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "用户名已被使用";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "密码强度不够";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "网络错误，请检查连接";
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * 使用用户名和密码登录
 * @param {object} auth - Firebase Auth实例
 * @param {object} db - Firestore实例
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} { success: boolean, user?: object, error?: string }
 */
export const loginWithUsername = async (auth, db, username, password) => {
  if (!auth || !db) {
    return { success: false, error: "Firebase未初始化" };
  }

  // 验证输入
  if (!username || !password) {
    return { success: false, error: "请输入用户名和密码" };
  }

  try {
    // 查询用户名映射
    const usernameLower = username.toLowerCase();
    const usernameRef = doc(db, "usernames", usernameLower);
    const usernameDoc = await getDoc(usernameRef);

    if (!usernameDoc.exists()) {
      return { success: false, error: "用户名或密码错误" };
    }

    const usernameData = usernameDoc.data();
    const email = `${usernameLower}${EMAIL_DOMAIN}`;

    // 使用Firebase Email/Password登录
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return { success: true, user };
  } catch (error) {
    console.error("登录失败:", error);
    let errorMessage = "登录失败，请稍后重试";
    
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      errorMessage = "用户名或密码错误";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "用户名格式不正确";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "网络错误，请检查连接";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "请求过于频繁，请稍后再试";
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * 登出
 * @param {object} auth - Firebase Auth实例
 * @returns {Promise<void>}
 */
export const signOutUser = async (auth) => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("登出失败:", error);
    throw error;
  }
};

/**
 * 获取当前登录用户的用户名
 * @param {object} db - Firestore实例
 * @param {string} uid - 用户ID
 * @returns {Promise<string|null>} 用户名
 */
export const getCurrentUsername = async (db, uid) => {
  if (!db || !uid) return null;
  try {
    const profileRef = doc(db, "users", uid, "profile", "info");
    const profileDoc = await getDoc(profileRef);
    if (profileDoc.exists()) {
      return profileDoc.data().username || null;
    }
    return null;
  } catch (error) {
    console.error("获取用户名失败:", error);
    return null;
  }
};

/**
 * 迁移匿名用户数据到正式账号
 * @param {object} db - Firestore实例
 * @param {string} uid - 正式账号的用户ID
 * @param {object} anonymousData - 匿名用户数据 { vocab, errors, history }
 * @returns {Promise<object>} { success: boolean, error?: string }
 */
export const migrateAnonymousData = async (db, appId, uid, anonymousData) => {
  if (!db || !uid || !anonymousData) {
    return { success: false, error: "参数不完整" };
  }

  try {
    // 读取正式账号的现有数据
    const notebookRef = doc(db, "artifacts", appId, "users", uid, "userData", "notebook");
    const historyRef = doc(db, "artifacts", appId, "users", uid, "userData", "history");
    
    const [notebookDoc, historyDoc] = await Promise.all([
      getDoc(notebookRef),
      getDoc(historyRef)
    ]);

    // 合并词汇数据（去重）
    const existingVocab = notebookDoc.exists() ? (notebookDoc.data().vocab || []) : [];
    const existingWords = new Set(existingVocab.map(v => v.word));
    const newVocab = [
      ...anonymousData.vocab.filter(v => !existingWords.has(v.word)),
      ...existingVocab
    ];

    // 合并错题数据
    const existingErrors = notebookDoc.exists() ? (notebookDoc.data().errors || []) : [];
    const newErrors = [...anonymousData.errors, ...existingErrors];

    // 合并历史记录
    const existingHistory = historyDoc.exists() ? (historyDoc.data().records || {}) : {};
    const newHistory = { ...existingHistory };
    
    Object.keys(anonymousData.history || {}).forEach(topicId => {
      const existingRecords = existingHistory[topicId] || [];
      const anonymousRecords = anonymousData.history[topicId] || [];
      newHistory[topicId] = [...anonymousRecords, ...existingRecords];
    });

    // 保存合并后的数据
    await Promise.all([
      setDoc(notebookRef, { vocab: newVocab, errors: newErrors }),
      setDoc(historyRef, { records: newHistory })
    ]);

    return { success: true };
  } catch (error) {
    console.error("数据迁移失败:", error);
    return { success: false, error: "数据迁移失败: " + error.message };
  }
};

/**
 * 监听认证状态变化
 * @param {object} auth - Firebase Auth实例
 * @param {function} callback - 回调函数
 * @returns {function} 取消监听的函数
 */
export const onAuthStateChange = (auth, callback) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

