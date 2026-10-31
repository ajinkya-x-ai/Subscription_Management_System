import React, { useState } from 'react';
import { User, Role } from '../types';
import { store } from '../services/store';
import {
  ChevronDown,
  User as UserIcon,
  Shield,
  Briefcase,
  Store,
  LogOut,
  UserPlus,
  KeyRound,
  RotateCcw,
  Download,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  activeViewTitle: string;
  onOpenAuthModal: (mode: 'login' | 'register' | 'forgot') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeViewTitle,
  onOpenAuthModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const users = store.getUsers();

  const handleSwitchUser = (userId: string) => {
    store.setCurrentUser(userId);
    setDropdownOpen(false);
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-indigo-500" />;
      case 'staff':
        return <Briefcase className="w-3.5 h-3.5 text-teal-500" />;
      case 'customer':
        return <Store className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'staff':
        return 'Internal Staff';
      case 'customer':
        return 'Customer Portal';
    }
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-neutral-200 flex items-center justify-between gap-8 shrink-0 relative z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
          BL
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-neutral-900 whitespace-nowrap">
            Brightloop Software
          </span>
          <span className="text-xs text-neutral-400 font-normal hidden sm:inline">
            / Subscription & Billing
          </span>
        </div>
      </div>

      {/* Zone 2: Contextual Breadcrumb Indicator */}
      <div className="hidden md:flex items-center gap-2 text-sm text-neutral-500 font-medium truncate">
        <span>Workspace</span>
        <span className="text-neutral-300">/</span>
        <span className="text-neutral-900 font-semibold">{activeViewTitle}</span>
      </div>

      {/* Zone 3: Primary Action & Persona Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Direct Download ZIP for GitHub */}
        <a
          href="/brightloop-subscription-system.zip"
          download="brightloop-subscription-system.zip"
          title="Download complete source code archive (.zip) for GitHub"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download ZIP</span>
        </a>

        {/* Quick Reset Demo Data Button */}
        <button
          onClick={() => {
            if (confirm('Reset demo state to initial seed data?')) {
              store.resetToFactory();
              window.location.reload();
            }
          }}
          title="Reset to factory demo state"
          className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Persona & Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
          >
            <div
              className={`w-7 h-7 rounded-full ${currentUser.avatarColor || 'bg-neutral-800'} text-white flex items-center justify-center text-xs font-semibold`}
            >
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-neutral-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                {getRoleIcon(currentUser.role)}
                <span>{getRoleLabel(currentUser.role)}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Current Persona
                  </div>
                  <div className="text-sm font-semibold text-neutral-900 mt-0.5">
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-neutral-500">{currentUser.email}</div>
                  <div className="text-xs text-neutral-600 mt-1 font-medium">
                    {currentUser.companyName}
                  </div>
                </div>

                <div className="px-3 py-2">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 mb-1.5">
                    Switch Test Account
                  </div>
                  <div className="space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-neutral-100 text-neutral-900 font-semibold'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full ${u.avatarColor || 'bg-neutral-700'} text-white flex items-center justify-center text-[10px]`}
                          >
                            {u.name[0]}
                          </div>
                          <div className="text-left">
                            <div>{u.name}</div>
                            <div className="text-[10px] text-neutral-400">
                              {u.role === 'admin'
                                ? 'Admin'
                                : u.role === 'staff'
                                ? 'Staff Rep'
                                : 'Customer'}
                            </div>
                          </div>
                        </div>
                        {u.id === currentUser.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-100 px-2 pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAuthModal('register');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Create New Customer Account</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAuthModal('forgot');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors font-medium"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Simulate Password Reset Link</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
