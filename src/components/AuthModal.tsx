import React, { useState } from 'react';
import { store } from '../services/store';
import { User, Role } from '../types';
import {
  KeyRound,
  Mail,
  Lock,
  User as UserIcon,
  Building,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface AuthModalProps {
  initialMode: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [resetTokenEmail, setResetTokenEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resetLinkSent, setResetLinkSent] = useState<string | null>(null);

  // Live password validation feedback
  const hasLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-=+~`[\]/\\]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }

    const res = store.registerCustomer(name, email, password, companyName);
    if (!res.success) {
      setError(res.message);
      return;
    }

    if (res.user) {
      onSuccess(res.user);
      onClose();
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const users = store.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      setError('No registered account found with this email address.');
      return;
    }

    const token = Math.random().toString(36).slice(2, 10);
    const simulatedLink = `https://app.brightloop.io/reset-password?token=${token}&email=${encodeURIComponent(
      user.email
    )}`;
    setResetTokenEmail(user.email);
    setResetLinkSent(simulatedLink);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = store.resetPassword(resetTokenEmail, password);
    if (!res.success) {
      setError(res.message);
      return;
    }

    alert('Password updated successfully! You can now log in.');
    setMode('login');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              {mode === 'register' && 'New Customer Sign Up'}
              {mode === 'login' && 'Account Log In'}
              {mode === 'forgot' && 'Password Assistance'}
              {mode === 'reset' && 'Create New Password'}
            </div>
            <h3 className="text-base font-bold text-neutral-900 mt-0.5">
              {mode === 'register' && 'Create Your Brightloop Account'}
              {mode === 'login' && 'Sign in to Brightloop'}
              {mode === 'forgot' && 'Reset Your Password'}
              {mode === 'reset' && 'Set Secure Password'}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-sm">
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Your Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Taylor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Company / Business Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Taylor Logistics Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Work Email (Unique Account)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="jessica@taylorlogistics.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-2.5 p-3 rounded-lg bg-neutral-50 border border-neutral-100 space-y-1 text-[11px]">
                <div className="font-semibold text-neutral-500 mb-1">Password Requirements:</div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasLength ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>More than 8 characters ({password.length}/9+)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasUpper ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasLower ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasSpecial ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least one special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isPasswordValid}
              className={`w-full py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                isPasswordValid
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              Create Account & Enter Customer Portal
            </button>

            <div className="text-center text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-neutral-900 font-semibold hover:underline"
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <div className="space-y-4 text-xs">
            {!resetLinkSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-neutral-600 leading-relaxed">
                  Enter your registered account email. A secure reset link will be dispatched to your registered address.
                </p>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. david@acmeretail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Generate Password Reset Link
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Reset Link Dispatched to {resetTokenEmail}</span>
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    Simulated email received! Click the button below to interactively set your new password:
                  </p>
                  <div className="bg-white p-2 rounded border border-emerald-200 font-mono text-[10px] text-neutral-600 break-all">
                    {resetLinkSent}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPassword('');
                    setMode('reset');
                  }}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Open Reset Screen Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="text-center text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-neutral-900 font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* RESET NEW PASSWORD MODE */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <p className="text-neutral-600">
              Resetting password for <strong className="font-mono text-neutral-900">{resetTokenEmail}</strong>.
            </p>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-mono"
              />

              {/* Password Checklist */}
              <div className="mt-2.5 p-3 rounded-lg bg-neutral-50 border border-neutral-100 space-y-1 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasLength ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>More than 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasUpper ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasLower ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasSpecial ? 'text-emerald-700' : 'text-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least one special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isPasswordValid}
              className={`w-full py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                isPasswordValid
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              Update Password
            </button>
          </form>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <div className="space-y-4 text-xs">
            <p className="text-neutral-500">
              Select an account persona below or enter registered credentials:
            </p>

            <div className="space-y-2">
              {store.getUsers().map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    store.setCurrentUser(u.id);
                    onSuccess(u);
                    onClose();
                  }}
                  className="w-full p-2.5 border border-neutral-200 hover:border-neutral-300 rounded-lg text-left flex items-center justify-between transition-colors bg-white hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full ${
                        u.avatarColor || 'bg-neutral-800'
                      } text-white flex items-center justify-center text-xs font-bold`}
                    >
                      {u.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{u.name}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{u.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-neutral-500 hover:text-neutral-900"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-neutral-900 font-semibold hover:underline"
              >
                Create New Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
