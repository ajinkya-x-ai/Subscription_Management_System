import React, { useState, useMemo } from 'react';
import { store } from '../services/store';
import {
  TrendingUp,
  Receipt,
  AlertCircle,
  CreditCard,
  FileSpreadsheet,
  Download,
  Mail,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToBillingDay: () => void;
  onNavigateToInvoices: () => void;
  onNavigateToSubscriptions: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToBillingDay,
  onNavigateToInvoices,
  onNavigateToSubscriptions,
}) => {
  const [timeFilter, setTimeFilter] = useState<'month' | 'quarter' | 'ytd' | 'all'>('month');
  const [notification, setNotification] = useState<string | null>(null);

  const metrics = useMemo(() => store.getFinanceMetrics(), []);
  const invoices = store.getInvoices();
  const subscriptions = store.getSubscriptions();
  const products = store.getProducts();

  const overdueInvoices = useMemo(() => {
    return invoices.filter((i) => i.status === 'overdue' && i.balanceDue > 0);
  }, [invoices]);

  const handleSendReminder = (invoiceId: string, customerEmail: string) => {
    store.sendInvoice(invoiceId);
    setNotification(`Payment reminder notice sent directly to ${customerEmail}`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Type', 'Number', 'Customer', 'Status', 'Amount', 'Date', 'Notes'],
      ...subscriptions.map((s) => [
        'Subscription',
        s.subNumber,
        `"${s.customerName} (${s.companyName})"`,
        s.status,
        s.totalAmount,
        s.nextBillingDate,
        `"${s.notes || ''}"`,
      ]),
      ...invoices.map((i) => [
        'Invoice',
        i.invoiceNumber,
        `"${i.customerName}"`,
        i.status,
        i.totalAmount,
        i.dueDate,
        `"Balance: $${i.balanceDue}"`,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `brightloop_finance_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-neutral-900 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-neutral-400 hover:text-white ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Financial & Recurring Revenue Command
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time monthly reconciliation, active contracts, MRR ledger, and overdue invoice aging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Bar */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            {(
              [
                { id: 'month', label: 'Current Month' },
                { id: 'quarter', label: 'Quarter Q3/Q4' },
                { id: 'ytd', label: 'Year to Date' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeFilter(t.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  timeFilter === t.id
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metrics Row (High Density, Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Subscriptions */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>Active Subscriptions</span>
            <FileSpreadsheet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums">
            {metrics.activeSubscriptionsCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-medium">100% healthy</span>
            <span className="text-neutral-300">·</span>
            <span>{metrics.totalSubscriptionsCount} total in records</span>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>Monthly Recurring Rev (MRR)</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums">
            ${metrics.mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
            <span>ARR:</span>
            <span className="font-semibold text-neutral-800 tabular-nums">
              ${metrics.arr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Cash Collected */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>Total Cash Collected</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums">
            ${metrics.totalCashCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Reconciled against bank statements
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>Outstanding Receivables</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums">
            ${metrics.outstandingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Open confirmed balances
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium mb-1">
            <span>Overdue Balances</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">
            ${metrics.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            {metrics.overdueInvoicesCount} invoices require chasing
          </div>
        </div>
      </div>

      {/* Quick Action Prompt to Run Billing Day */}
      <div className="bg-neutral-900 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recurring Billing Operations</span>
          </div>
          <h2 className="text-base font-bold text-white mt-1">
            Automated Billing Run Engine Ready
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Generate recurring invoices for active subscriptions with automated taxes and discount rules applied. No manual typing, zero duplicates.
          </p>
        </div>
        <button
          onClick={onNavigateToBillingDay}
          className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm shrink-0"
        >
          <span>Open Billing Day Runner</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Overdue Invoices Aging Buckets & Chasing Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Receivables Aging & Overdue Chase List
            </h2>
            <p className="text-xs text-neutral-500">
              Invoices exceeding payment terms. Chase overdue accounts before they turn into bad debt.
            </p>
          </div>

          {/* Aging Buckets Pill/Segmented Summary */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-500 text-[11px]">Aging Buckets:</span>
            <div className="px-2 py-1 bg-neutral-100 rounded text-neutral-800 tabular-nums">
              Current: ${metrics.aging.current.toLocaleString()}
            </div>
            <div className="px-2 py-1 bg-amber-50 rounded text-amber-800 tabular-nums">
              1-30d: ${metrics.aging.days1To30.toLocaleString()}
            </div>
            <div className="px-2 py-1 bg-rose-50 rounded text-rose-800 tabular-nums">
              31-60d+: ${metrics.aging.days31To60 + metrics.aging.days60Plus}
            </div>
          </div>
        </div>

        {overdueInvoices.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-semibold text-neutral-800">All Invoices Up to Date</div>
            <p className="text-neutral-400 mt-1">
              There are no overdue accounts on the books at this time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Customer & Company</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-right">Invoice Total</th>
                  <th className="py-2.5 px-4 text-right">Balance Due</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {overdueInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{inv.customerName}</div>
                      <div className="text-[11px] text-neutral-500">{inv.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-medium">
                      {inv.dueDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-600">
                      ${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-700">
                      ${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[11px] font-semibold text-rose-700">
                        Overdue
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSendReminder(inv.id, inv.customerEmail)}
                        className="px-2.5 py-1 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-md transition-colors inline-flex items-center gap-1.5"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Chase Overdue</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Plan Breakdown & Subscriptions Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Products & Plans Distribution */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-900">
              Product Portfolio & Price Rules
            </h3>
            <button
              onClick={onNavigateToSubscriptions}
              className="text-xs text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1"
            >
              <span>View All Subscriptions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {products.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-neutral-100 hover:border-neutral-200 bg-neutral-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-neutral-900">{p.name}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {p.variants.length > 0
                      ? `${p.variants.length} active variants (incl. Odoo +$560)`
                      : 'Standard module'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-neutral-900 tabular-nums">
                    ${p.salesPrice.toLocaleString()}/mo
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Cost: ${p.costPrice} · Margin {Math.round(((p.salesPrice - p.costPrice) / p.salesPrice) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions Status Breakdown */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-900">
              Subscription Lifecycle Stages
            </h3>
            <span className="text-xs text-neutral-400">
              {subscriptions.length} registered records
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'Active Running',
                count: subscriptions.filter((s) => s.status === 'active').length,
                color: 'text-emerald-700 bg-emerald-50',
              },
              {
                label: 'Past Due (Retrying)',
                count: subscriptions.filter((s) => s.status === 'past_due').length,
                color: 'text-rose-700 bg-rose-50',
              },
              {
                label: 'Quotations Sent',
                count: subscriptions.filter((s) => s.status === 'quotation').length,
                color: 'text-indigo-700 bg-indigo-50',
              },
              {
                label: 'Draft Quotes',
                count: subscriptions.filter((s) => s.status === 'draft').length,
                color: 'text-neutral-700 bg-neutral-100',
              },
              {
                label: 'Paused (On Hold)',
                count: subscriptions.filter((s) => s.status === 'paused').length,
                color: 'text-amber-700 bg-amber-50',
              },
              {
                label: 'Closed / Terminated',
                count: subscriptions.filter((s) => s.status === 'closed').length,
                color: 'text-neutral-500 bg-neutral-50',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-neutral-100 flex items-center justify-between"
              >
                <div className="text-xs text-neutral-600 font-medium">{stat.label}</div>
                <div className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${stat.color}`}>
                  {stat.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
