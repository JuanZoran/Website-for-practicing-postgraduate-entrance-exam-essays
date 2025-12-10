import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Loader, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { 
  registerWithUsername, 
  loginWithUsername, 
  validateUsername, 
  validatePassword 
} from '../services/authService';

const AuthModal = ({ isOpen, onClose, auth, db, onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 重置表单
      setMode('login');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setUsernameError('');
      setPasswordError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  // 实时验证用户名
  useEffect(() => {
    if (username && mode === 'register') {
      const validation = validateUsername(username);
      setUsernameError(validation.valid ? '' : validation.error);
    } else {
      setUsernameError('');
    }
  }, [username, mode]);

  // 实时验证密码
  useEffect(() => {
    if (password && mode === 'register') {
      const validation = validatePassword(password);
      setPasswordError(validation.valid ? '' : validation.error);
    } else {
      setPasswordError('');
    }
  }, [password, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 验证输入
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    if (mode === 'register') {
      // 注册模式验证
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        setError(usernameValidation.error);
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.error);
        return;
      }

      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setLoading(true);

    try {
      let result;
      if (mode === 'register') {
        result = await registerWithUsername(auth, db, username.trim(), password);
      } else {
        result = await loginWithUsername(auth, db, username.trim(), password);
      }

      if (result.success) {
        // 登录/注册成功
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
        onClose();
      } else {
        setError(result.error || '操作失败');
      }
    } catch (err) {
      console.error('认证错误:', err);
      setError('发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {mode === 'login' ? (
              <LogIn className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            )}
            <h3 className="font-bold text-lg dark:text-white">
              {mode === 'login' ? '登录' : '注册'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名输入 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                usernameError ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="请输入用户名（3-20个字符）"
              disabled={loading}
              autoComplete="username"
            />
            {usernameError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {usernameError}
              </p>
            )}
          </div>

          {/* 密码输入 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors pr-10 ${
                  passwordError ? 'border-red-300 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="请输入密码（至少6个字符）"
                disabled={loading}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {passwordError}
              </p>
            )}
          </div>

          {/* 确认密码（仅注册模式） */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                确认密码
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors pr-10 border-slate-300 dark:border-slate-600"
                  placeholder="请再次输入密码"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  两次输入的密码不一致
                </p>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                处理中...
              </>
            ) : (
              mode === 'login' ? '登录' : '注册'
            )}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <p className="text-slate-600 dark:text-slate-400">
              还没有账号？{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                立即注册
              </button>
            </p>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">
              已有账号？{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                立即登录
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

