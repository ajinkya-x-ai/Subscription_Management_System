import React, { useState } from 'react';
import { store } from '../services/store';
import { User, Role } from '../types';
import {
  Users2,
  UserPlus,
  Shield,
  Briefcase,
  CheckCircle2,
  Mail,
  Building,
} from 'lucide-react';

interface StaffManagementViewProps {
  currentRole: Role;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ currentRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [title, setTitle] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const users = store.getUsers();
  const staffMembers = users.filter((u) => u.role === 'admin' || u.role === 'staff');

  if (currentRole !== 'admin') {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center max-w-lg mx-auto mt-12">
        <Shield className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-neutral-900">Administrator Access Required</h3>
        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
          Only the administrator can add a new member of staff or adjust internal team permissions.
          Please switch to Elena Vance (Admin) using the persona dropdown in the header.
        </p>
      </div>
    );
  }

  const handleAddStaff = () => {
    if (!name.trim() || !email.trim()) return;

    const res = store.addStaffMember(name, email, role, title);
    if (res.success) {
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setTitle('');
      setNotification(res.message);
      setTimeout(() => setNotification(null), 3500);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div className="bg-neutral-900 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Admin Privilege Restricted</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight mt-0.5">
            Internal Staff & Team Management
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Only the admin can invite new staff members, assign roles, and delegate day-to-day operations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${
                      member.avatarColor || 'bg-neutral-800'
                    } text-white flex items-center justify-center text-xs font-semibold`}
                  >
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">{member.name}</h3>
                    <div className="text-[11px] text-neutral-500">{member.title}</div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    member.role === 'admin'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'bg-teal-50 text-teal-700 border border-teal-100'
                  }`}
                >
                  {member.role === 'admin' ? 'Administrator' : 'Internal Staff'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-mono text-[11px]">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{member.companyName}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400 font-mono">
                Joined: {new Date(member.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => {
                  store.setCurrentUser(member.id);
                  setNotification(`Switched active view to ${member.name}`);
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="text-xs text-neutral-900 font-semibold hover:underline"
              >
                Log In As →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Add Staff Member</h3>
                <p className="text-xs text-neutral-500">
                  Provision new team credentials for internal operations.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Cooper"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Company Email</label>
                <input
                  type="email"
                  placeholder="jordan@brightloop.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                >
                  <option value="staff">Internal Staff (Quotes, Billing, Invoices)</option>
                  <option value="admin">Administrator (Full System Control)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Position / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Billing Specialist"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Create Staff Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
