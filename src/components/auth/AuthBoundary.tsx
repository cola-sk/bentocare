'use client';

import { createContext, FormEvent, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

export type SessionUser = { id: string; username: string; displayName: string };
type AuthContextValue = { user: SessionUser; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthBoundary');
  return context;
}

function LoginForm({ onAuthenticated }: { onAuthenticated: (user: SessionUser) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ username, displayName, password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || '操作失败，请重试');
      // 只保存公开资料；会话令牌由 HttpOnly Cookie 保管，无法被脚本读取。
      localStorage.setItem('bentocare_last_user', JSON.stringify(payload.data));
      onAuthenticated(payload.data);
    } catch (err: any) {
      setError(err?.message || '网络异常，请重试');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[#faf9f6] flex items-center justify-center p-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">{isRegister ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}</div>
          <h1 className="text-lg font-semibold text-stone-900">伴学小账</h1>
          <p className="mt-1 text-xs text-stone-500">{isRegister ? '创建账户，数据仅对你可见' : '登录后继续管理孩子的考勤账本'}</p>
        </div>
        <div className="space-y-3">
          {isRegister && <label className="block text-xs font-medium text-stone-600">显示名称<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} required className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="例如：李妈妈" /></label>}
          <label className="block text-xs font-medium text-stone-600">用户名<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="3–32 位字母、数字或 ._-" /></label>
          <label className="block text-xs font-medium text-stone-600">密码<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={4} required className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="至少 4 位" /></label>
        </div>
        {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
        <button disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{isRegister ? '注册并登录' : '登录'}</button>
        <button type="button" onClick={() => { setIsRegister((value) => !value); setError(''); }} className="mt-4 w-full text-xs text-brand-700 hover:text-brand-900">{isRegister ? '已有账户？去登录' : '没有账户？创建一个'}</button>
      </form>
    </div>
  );
}

export function AuthBoundary({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' }).then(async (response) => {
      if (!response.ok) return null;
      const payload = await response.json();
      return payload.success ? payload.data as SessionUser : null;
    }).then((sessionUser) => {
      if (sessionUser) { localStorage.setItem('bentocare_last_user', JSON.stringify(sessionUser)); setUser(sessionUser); }
    }).catch(() => undefined).finally(() => setChecking(false));
  }, []);
  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    localStorage.removeItem('bentocare_last_user'); setUser(null);
  }, []);
  if (checking) return <div className="min-h-screen w-full bg-[#faf9f6] flex items-center justify-center text-stone-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <LoginForm onAuthenticated={setUser} />;
  return <AuthContext.Provider value={{ user, signOut }}><div className="w-full max-w-md bg-[#faf9f6] min-h-screen flex flex-col border-x border-stone-200 shadow-sm relative pb-20"><main className="flex-1 flex flex-col">{children}</main></div></AuthContext.Provider>;
}
