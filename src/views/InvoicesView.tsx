import React, { useState } from 'react';
import { store } from '../services/store';
import { Invoice, InvoiceStatus, PaymentMethod, Role } from '../types';
import {
  Search,
  Filter,
  Receipt,
  Printer,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';

interface InvoicesViewProps {
  currentRole: Role;
  customerOnlyEmail?: string;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  currentRole,
  customerOnlyEmail,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentRef, setPaymentRef] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const allInvoices = store.getInvoices();

  const userInvoices = customerOnlyEmail
    ? allInvoices.filter((i) => i.customerEmail.toLowerCase() === customerOnlyEmail.toLowerCase())
    : allInvoices;

  const filteredInvoices = userInvoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.subNumber && inv.subNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleConfirmInvoice = (id: string) => {
    store.updateInvoiceStatus(id, 'confirmed');
    setNotification('Invoice confirmed and published.');
    setTimeout(() => setNotification(null), 3000);
    const updated = store.getInvoiceById(id);
    if (updated) setActiveInvoice(updated);
  };

  const handleSendInvoice = (id: string) => {
    const res = store.sendInvoice(id);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 3500);
    const updated = store.getInvoiceById(id);
    if (updated) setActiveInvoice(updated);
  };

  const handleCancelInvoice = (id: string) => {
    if (confirm('Cancel and void this invoice? This cannot be undone.')) {
      store.updateInvoiceStatus(id, 'cancelled');
      setNotification('Invoice cancelled and marked as void.');
      setTimeout(() => setNotification(null), 3000);
      const updated = store.getInvoiceById(id);
      if (updated) setActiveInvoice(updated);
    }
  };

  const handleOpenPaymentModal = (inv: Invoice) => {
    setActiveInvoice(inv);
    setPaymentAmount(inv.balanceDue);
    setPaymentRef(`Wire REF #${Date.now().toString().slice(-6)}`);
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = () => {
    if (!activeInvoice) return;
    const currentUser = store.getCurrentUser();
    const res = store.recordPayment(
      activeInvoice.id,
      paymentAmount,
      paymentMethod,
      paymentDate,
      paymentRef || 'Manual reconciliation entry',
      `${currentUser.name} (${currentUser.role})`
    );

    setIsPaymentModalOpen(false);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 4000);
    const updated = store.getInvoiceById(activeInvoice.id);
    if (updated) setActiveInvoice(updated);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <span className="text-emerald-700 font-semibold">Paid</span>;
      case 'confirmed':
        return <span className="text-neutral-800 font-semibold">Confirmed</span>;
      case 'overdue':
        return <span className="text-rose-600 font-bold">Overdue</span>;
      case 'draft':
        return <span className="text-neutral-400 font-medium">Draft</span>;
      case 'cancelled':
        return <span className="text-neutral-400 font-medium">Cancelled</span>;
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
            Invoices & Billing Statements
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage lifecycle from Draft to Confirmed to Paid. Print, send, and match incoming customer payments.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'confirmed', label: 'Confirmed / Due' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'paid', label: 'Paid' },
            { id: 'draft', label: 'Draft' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === tab.id
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
            placeholder="Search invoice number, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Issue Date</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Total Amount</th>
                <th className="py-2.5 px-4 text-right">Balance Due</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className={`hover:bg-neutral-50 transition-colors ${
                    activeInvoice?.id === inv.id ? 'bg-neutral-100/60' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-neutral-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-neutral-900">{inv.customerName}</div>
                    <div className="text-[11px] text-neutral-500">{inv.customerEmail}</div>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{inv.issueDate}</td>
                  <td
                    className={`py-3 px-4 ${
                      inv.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-neutral-700'
                    }`}
                  >
                    {inv.dueDate}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">{getStatusBadge(inv.status)}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-neutral-800">
                    ${inv.totalAmount.toFixed(2)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right tabular-nums font-bold ${
                      inv.balanceDue > 0 ? 'text-neutral-900' : 'text-neutral-400'
                    }`}
                  >
                    ${inv.balanceDue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setActiveInvoice(inv);
                          setIsPrintModalOpen(true);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded"
                        title="Print / View Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {currentRole !== 'customer' && inv.status === 'draft' && (
                        <button
                          onClick={() => handleConfirmInvoice(inv.id)}
                          className="px-2 py-1 bg-neutral-900 text-white rounded text-[11px] font-medium"
                        >
                          Confirm
                        </button>
                      )}

                      {inv.balanceDue > 0 && inv.status !== 'cancelled' && (
                        <button
                          onClick={() => handleOpenPaymentModal(inv)}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-medium whitespace-nowrap"
                        >
                          {currentRole === 'customer' ? 'Pay Online' : 'Record Pay'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* High-Fidelity Printable Invoice Modal */}
      {isPrintModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto p-8 space-y-6 shadow-2xl relative">
            {/* Top Toolbar (Hidden on print) */}
            <div className="no-print flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Invoice Preview
                </span>
                <span className="text-xs">{getStatusBadge(activeInvoice.status)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-neutral-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                {activeInvoice.status === 'draft' && currentRole !== 'customer' && (
                  <button
                    onClick={() => handleConfirmInvoice(activeInvoice.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                  >
                    Confirm Invoice
                  </button>
                )}
                <button
                  onClick={() => handleSendInvoice(activeInvoice.id)}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send to Email</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
              <div>
                <div className="text-xl font-bold tracking-tight text-neutral-900">
                  Brightloop Software HQ
                </div>
                <div className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  100 Enterprise Way, Suite 400<br />
                  London, EC2A 2BB, United Kingdom<br />
                  Tax ID: GB-992-1049-88 · billing@brightloop.io
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-neutral-900">
                  {activeInvoice.invoiceNumber}
                </div>
                <div className="text-xs font-mono text-neutral-500 mt-1 space-y-0.5">
                  <div>Issue Date: {activeInvoice.issueDate}</div>
                  <div>Due Date: {activeInvoice.dueDate}</div>
                  <div className="capitalize">
                    Terms: {activeInvoice.paymentTerms.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <div className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px] mb-1">
                  Billed To:
                </div>
                <div className="font-bold text-neutral-900 text-sm">
                  {activeInvoice.customerName}
                </div>
                <div className="text-neutral-600 mt-0.5">{activeInvoice.customerEmail}</div>
                <div className="text-neutral-500 mt-0.5 whitespace-pre-line">
                  {activeInvoice.billingAddress}
                </div>
              </div>

              {activeInvoice.subNumber && (
                <div className="text-right">
                  <div className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px] mb-1">
                    Subscription Reference:
                  </div>
                  <div className="font-mono font-bold text-neutral-900">
                    {activeInvoice.subNumber}
                  </div>
                  {activeInvoice.billingPeriodStart && (
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Billing Period: {activeInvoice.billingPeriodStart} to{' '}
                      {activeInvoice.billingPeriodEnd}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Tax Rate</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {activeInvoice.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-neutral-900">{l.productName}</div>
                        {l.variantName && (
                          <div className="text-[11px] text-neutral-500">{l.variantName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{l.quantity}</td>
                      <td className="py-3 px-4 text-right">${l.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">{l.taxRate}%</td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-900">
                        ${l.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Calculations */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal:</span>
                  <span>${activeInvoice.subtotal.toFixed(2)}</span>
                </div>
                {activeInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-indigo-600 font-semibold">
                    <span>Discount Deduction:</span>
                    <span>-${activeInvoice.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500">
                  <span>Taxes Calculated:</span>
                  <span>${activeInvoice.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-2 border-t border-neutral-200 text-sm">
                  <span>Total Due:</span>
                  <span>${activeInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Amount Paid:</span>
                  <span>-${activeInvoice.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-1.5 border-t border-neutral-200 text-sm">
                  <span>Balance Remaining:</span>
                  <span className={activeInvoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    ${activeInvoice.balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Wire Instructions */}
            <div className="p-4 bg-neutral-50 rounded-xl text-xs text-neutral-500 border border-neutral-200 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <div className="font-semibold text-neutral-900 mb-0.5">
                  Remittance Instructions
                </div>
                <div>Bank: Barclays International Corporate UK</div>
                <div>IBAN: GB82 BARC 2026 0019 8892 11</div>
                <div>SWIFT / BIC: BARCGB22XXX</div>
                <div>Please reference {activeInvoice.invoiceNumber} on wire transfer memos.</div>
              </div>
              {activeInvoice.sentAt && (
                <div className="text-right text-[11px] text-neutral-400">
                  Dispatched: {new Date(activeInvoice.sentAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {currentRole === 'customer' ? 'Pay Invoice Online' : 'Record Customer Payment'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Matching against {activeInvoice.invoiceNumber} ({activeInvoice.customerName})
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Payment Amount ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-neutral-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={activeInvoice.balanceDue}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-lg font-mono font-bold text-sm focus:outline-none"
                  />
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 flex justify-between">
                  <span>Balance Due: ${activeInvoice.balanceDue.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(activeInvoice.balanceDue)}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    Pay Full Balance
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                >
                  <option value="bank_transfer">Bank Wire Transfer</option>
                  <option value="credit_card">Corporate Credit Card</option>
                  <option value="stripe">Stripe Instant Checkout</option>
                  <option value="ach_debit">ACH Direct Debit</option>
                  <option value="check">Company Check</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Reference / Bank Memo / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. Wire REF #FED-49021, Check #1042"
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Confirm Payment of ${paymentAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
