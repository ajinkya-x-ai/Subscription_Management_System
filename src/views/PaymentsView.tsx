import React, { useState } from 'react';
import { store } from '../services/store';
import { Payment, PaymentMethod, Role } from '../types';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Receipt,
  DollarSign,
  Building,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface PaymentsViewProps {
  currentRole: Role;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ currentRole }) => {
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [refNotes, setRefNotes] = useState('');

  const payments = store.getPayments();
  const invoices = store.getInvoices();
  const openInvoices = invoices.filter((i) => i.balanceDue > 0 && i.status !== 'cancelled');

  const filteredPayments = payments.filter((p) => {
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
    const matchesSearch =
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referenceNotes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const handleOpenRecordModal = () => {
    if (openInvoices.length > 0) {
      setSelectedInvoiceId(openInvoices[0].id);
      setAmount(openInvoices[0].balanceDue);
    }
    setRefNotes(`Ref #${Date.now().toString().slice(-6)}`);
    setIsRecordModalOpen(true);
  };

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) setAmount(inv.balanceDue);
  };

  const handleSubmitPayment = () => {
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    if (!inv) return;

    const currentUser = store.getCurrentUser();
    const res = store.recordPayment(
      inv.id,
      amount,
      method,
      date,
      refNotes,
      `${currentUser.name} (${currentUser.role})`
    );

    setIsRecordModalOpen(false);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 4000);
  };

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  const formatMethod = (m: PaymentMethod) => {
    switch (m) {
      case 'bank_transfer':
        return 'Bank Wire Transfer';
      case 'credit_card':
        return 'Corporate Card';
      case 'ach_debit':
        return 'ACH Direct Debit';
      case 'stripe':
        return 'Stripe Checkout';
      case 'check':
        return 'Company Check';
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
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Payments & Cash Reconciliation Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Record incoming payments across methods and reconcile directly to invoice balances.
          </p>
        </div>

        {currentRole !== 'customer' && (
          <button
            onClick={handleOpenRecordModal}
            disabled={openInvoices.length === 0}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap ${
              openInvoices.length === 0
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Record Received Payment</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-neutral-200">
          <div className="text-xs text-neutral-500 font-medium">Total Cash Reconciled</div>
          <div className="text-2xl font-bold text-neutral-900 font-mono mt-1 tabular-nums">
            ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Across all verified payment channels</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200">
          <div className="text-xs text-neutral-500 font-medium">Logged Transactions</div>
          <div className="text-2xl font-bold text-neutral-900 font-mono mt-1 tabular-nums">
            {payments.length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">All verified without bank discrepancy</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200">
          <div className="text-xs text-neutral-500 font-medium">Open Invoices Requiring Payment</div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-1 tabular-nums">
            {openInvoices.length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Ready for payment matching</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'All Methods' },
            { id: 'bank_transfer', label: 'Bank Transfer' },
            { id: 'stripe', label: 'Stripe' },
            { id: 'ach_debit', label: 'ACH Debit' },
            { id: 'credit_card', label: 'Credit Card' },
            { id: 'check', label: 'Check' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethodFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                methodFilter === tab.id
                  ? 'bg-white text-neutral-900 shadow-sm font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice, customer, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Payment Date</th>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Customer Account</th>
                <th className="py-2.5 px-4">Payment Method</th>
                <th className="py-2.5 px-4">Reference & Notes</th>
                <th className="py-2.5 px-4 text-right">Amount Received</th>
                <th className="py-2.5 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 text-neutral-700">{p.date}</td>
                  <td className="py-3 px-4 font-bold text-neutral-900">{p.invoiceNumber}</td>
                  <td className="py-3 px-4 font-sans font-medium text-neutral-900">
                    {p.customerName}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="text-neutral-700 font-medium">
                      {formatMethod(p.method)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                    {p.referenceNotes}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-700">
                    +${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 font-sans text-neutral-500 text-[11px]">
                    {p.recordedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Record Incoming Payment</h3>
                <p className="text-xs text-neutral-500">
                  Select an open invoice and record bank statement settlement.
                </p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Target Outstanding Invoice
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                >
                  {openInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} (Due: ${inv.balanceDue.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Amount Received ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 border border-neutral-200 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                >
                  <option value="bank_transfer">Bank Wire Transfer</option>
                  <option value="credit_card">Corporate Credit Card</option>
                  <option value="stripe">Stripe Gateway</option>
                  <option value="ach_debit">ACH Direct Debit</option>
                  <option value="check">Company Check</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Payment Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Bank Reference / Memo
                </label>
                <input
                  type="text"
                  value={refNotes}
                  onChange={(e) => setRefNotes(e.target.value)}
                  placeholder="e.g. Wire confirmation #BARC-99210"
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save Payment Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
