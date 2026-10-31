import React from 'react';
import { Role } from '../types';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Package,
  Layers,
  FileText,
  Percent,
  Users2,
  Store,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export type ViewType =
  | 'dashboard'
  | 'billing-day'
  | 'subscriptions'
  | 'invoices'
  | 'payments'
  | 'products-plans'
  | 'quotation-templates'
  | 'discounts-taxes'
  | 'staff'
  | 'customer-portal';

interface SidebarProps {
  currentRole: Role;
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  unpaidCount: number;
  billingDueCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeView,
  onSelectView,
  unpaidCount,
  billingDueCount,
}) => {
  // Navigation for Admin and Staff
  const internalNav = [
    {
      id: 'dashboard' as ViewType,
      label: 'Finance Overview',
      subtitle: 'End-of-Month Metrics',
      icon: LayoutDashboard,
      roles: ['admin', 'staff'],
    },
    {
      id: 'billing-day' as ViewType,
      label: 'Billing Day Runner',
      subtitle: 'Automated Batch Engine',
      icon: CalendarCheck,
      roles: ['admin', 'staff'],
      badge: billingDueCount > 0 ? `${billingDueCount} due` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'subscriptions' as ViewType,
      label: 'Subscriptions & Quotes',
      subtitle: 'Quotes to Active Subs',
      icon: FileSpreadsheet,
      roles: ['admin', 'staff'],
    },
    {
      id: 'invoices' as ViewType,
      label: 'Invoices',
      subtitle: 'Draft · Confirmed · Paid',
      icon: Receipt,
      roles: ['admin', 'staff'],
      badge: unpaidCount > 0 ? `${unpaidCount} open` : undefined,
      badgeColor: 'bg-neutral-100 text-neutral-800',
    },
    {
      id: 'payments' as ViewType,
      label: 'Payments Reconciliation',
      subtitle: 'Bank & Card Ledger',
      icon: CreditCard,
      roles: ['admin', 'staff'],
    },
    {
      id: 'quotation-templates' as ViewType,
      label: 'Quotation Templates',
      subtitle: 'Reusable Sales Offers',
      icon: FileText,
      roles: ['admin', 'staff'],
    },
    {
      id: 'products-plans' as ViewType,
      label: 'Products & Plans',
      subtitle: 'Variants, Cadences, Rules',
      icon: Package,
      roles: ['admin', 'staff'],
    },
    {
      id: 'discounts-taxes' as ViewType,
      label: 'Discounts & Taxes',
      subtitle: 'Admin Rate & Promo Engine',
      icon: Percent,
      roles: ['admin'], // Admin only per prompt requirement!
    },
    {
      id: 'staff' as ViewType,
      label: 'Staff Management',
      subtitle: 'Admin Only Team Access',
      icon: Users2,
      roles: ['admin'], // Admin only per prompt requirement!
    },
    {
      id: 'customer-portal' as ViewType,
      label: 'Customer Portal View',
      subtitle: 'Customer Self-Service',
      icon: Store,
      roles: ['admin', 'staff'],
    },
  ];

  // Navigation for Customer
  const customerNav = [
    {
      id: 'customer-portal' as ViewType,
      label: 'My Subscriptions & Quotes',
      subtitle: 'Manage Add-ons & Accept Offers',
      icon: Store,
      roles: ['customer'],
    },
    {
      id: 'invoices' as ViewType,
      label: 'My Invoices & Receipts',
      subtitle: 'View Balance & Pay Online',
      icon: Receipt,
      roles: ['customer'],
      badge: unpaidCount > 0 ? `${unpaidCount} unpaid` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
  ];

  const items = currentRole === 'customer' ? customerNav : internalNav;

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            {currentRole === 'customer' ? 'Customer Self-Service' : 'Operations Suite'}
          </div>
          <div className="text-xs font-medium text-neutral-700 mt-0.5">
            {currentRole === 'admin' && 'Full Administrator Controls'}
            {currentRole === 'staff' && 'Internal Staff Workspace'}
            {currentRole === 'customer' && 'Self-Service Portal'}
          </div>
        </div>
        {currentRole === 'admin' && (
          <span title="Admin privilege active">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </span>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-neutral-400'
                  }`}
                />
                <div className="truncate">
                  <div className="truncate leading-tight">{item.label}</div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums shrink-0 ml-2 ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-200'
                      : item.badgeColor || 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status Banner */}
      <div className="p-3 border-t border-neutral-100 text-[11px] text-neutral-500 bg-neutral-50/50">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>Brightloop Core</span>
          <span className="text-emerald-700 font-medium">Synchronized</span>
        </div>
      </div>
    </aside>
  );
};
