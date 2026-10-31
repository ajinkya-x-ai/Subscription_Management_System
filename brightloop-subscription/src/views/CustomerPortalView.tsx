import React, { useState } from 'react';
import { store } from '../services/store';
import { User, Subscription, Invoice, Product } from '../types';
import {
  Store,
  Layers,
  Receipt,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  AlertCircle,
  FileText,
  Pause,
  Play,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface CustomerPortalViewProps {
  currentUser: User;
  onNavigateToInvoiceDetail?: (invoiceId: string) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  currentUser,
  onNavigateToInvoiceDetail,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    currentUser.role === 'customer' ? currentUser.id : 'user-cust-1'
  );
  const [notification, setNotification] = useState<string | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const users = store.getUsers();
  const customerUsers = users.filter((u) => u.role === 'customer');
  const activeCustomer =
    customerUsers.find((c) => c.id === selectedCustomerId) || customerUsers[0] || currentUser;

  const allSubscriptions = store.getSubscriptions();
  const mySubscriptions = allSubscriptions.filter(
    (s) => s.customerEmail.toLowerCase() === activeCustomer.email.toLowerCase()
  );

  const allInvoices = store.getInvoices();
  const myInvoices = allInvoices.filter(
    (i) => i.customerEmail.toLowerCase() === activeCustomer.email.toLowerCase()
  );

  const products = store.getProducts();
  const addonProducts = products.filter((p) => p.type === 'addon');

  const pendingQuotes = mySubscriptions.filter((s) => s.status === 'quotation');
  const pastDueSubs = mySubscriptions.filter((s) => s.status === 'past_due');
  const activeSubs = mySubscriptions.filter(
    (s) => s.status === 'active' || s.status === 'paused' || s.status === 'past_due'
  );

  const handleToggleAddon = (subId: string, addonProdId: string, currentEnabled: boolean) => {
    const res = store.toggleSubscriptionAddon(subId, addonProdId, !currentEnabled);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAcceptQuote = (subId: string) => {
    const res = store.updateSubscriptionStatus(subId, 'active');
    setNotification('Quotation accepted! Your subscription is now active.');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeclineQuote = (subId: string) => {
    if (confirm('Decline this proposal?')) {
      const res = store.updateSubscriptionStatus(subId, 'closed');
      setNotification('Proposal declined.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handlePauseResume = (sub: Subscription) => {
    const targetStatus = sub.status === 'paused' ? 'active' : 'paused';
    const res = store.updateSubscriptionStatus(sub.id, targetStatus);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.balanceDue);
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = () => {
    if (!selectedInvoice) return;
    const res = store.recordPayment(
      selectedInvoice.id,
      payAmount,
      'credit_card',
      new Date().toISOString().slice(0, 10),
      `Online Portal Payment #${Date.now().toString().slice(-6)}`,
      `${activeCustomer.name} (Customer Portal)`
    );
    setIsPayModalOpen(false);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 4000);
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

      {/* Header & Preview Persona Switcher (if admin/staff previewing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Customer Self-Service Portal
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage recurring subscriptions, turn add-ons on/off, accept quotations, and settle invoices.
          </p>
        </div>

        {currentUser.role !== 'customer' && (
          <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <span className="font-semibold text-amber-900">Admin View Mode:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-white border border-amber-300 rounded px-2 py-1 text-xs font-medium text-amber-900"
            >
              {customerUsers.map((c) => (
                <option key={c.id} value={c.id}>
                  Previewing: {c.name} ({c.companyName})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Customer Account Identity Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${
              activeCustomer.avatarColor || 'bg-amber-600'
            } text-white flex items-center justify-center text-sm font-bold shadow-xs`}
          >
            {activeCustomer.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900">{activeCustomer.name}</div>
            <div className="text-xs text-neutral-500">
              {activeCustomer.companyName} · {activeCustomer.email}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono">
          <div>
            <span className="text-neutral-400 block text-[10px]">Active Subscriptions:</span>
            <span className="text-sm font-bold text-neutral-900">{activeSubs.length}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">Pending Quotes:</span>
            <span className="text-sm font-bold text-indigo-700">{pendingQuotes.length}</span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[10px]">Invoices On File:</span>
            <span className="text-sm font-bold text-neutral-900">{myInvoices.length}</span>
          </div>
        </div>
      </div>

      {/* Pending Quotations Requiring Acceptance */}
      {pendingQuotes.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-indigo-950">
                You have {pendingQuotes.length} Proposal / Quotation Awaiting Your Approval
              </h2>
            </div>
            <span className="text-xs text-indigo-800 font-mono">Review & Accept</span>
          </div>

          <div className="space-y-3">
            {pendingQuotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white rounded-lg p-4 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-neutral-900">
                      {quote.subNumber}
                    </span>
                    <span className="text-xs font-medium text-neutral-600">· {quote.planName}</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    Valid until {quote.expiryDate} · {quote.paymentTerms.replace('_', ' ')}
                  </div>
                  {quote.notes && (
                    <div className="text-[11px] text-neutral-600 italic mt-1">{quote.notes}</div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {quote.lines.map((l) => (
                      <span
                        key={l.id}
                        className="text-[11px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-medium"
                      >
                        {l.productName} ({l.variantName ? `${l.variantName} ` : ''}×{l.quantity})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-neutral-900 text-sm">
                      ${quote.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-neutral-400 capitalize">
                      {quote.billingFrequency}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeclineQuote(quote.id)}
                      className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-semibold rounded-lg"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptQuote(quote.id)}
                      className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Accept Proposal</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past-Due Payment Notice Banner for Customer */}
      {pastDueSubs.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-rose-950">
              Payment Action Needed: {pastDueSubs.length} subscription has a failed payment attempt
            </h2>
          </div>
          <div className="space-y-2">
            {pastDueSubs.map((sub) => (
              <div
                key={sub.id}
                className="bg-white p-3.5 rounded-lg border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900">{sub.subNumber}</span>
                    <span className="text-rose-700 font-semibold">
                      · Attempt #{sub.paymentFailureCount || 1} Failed
                    </span>
                  </div>
                  <div className="text-neutral-600 mt-0.5">
                    Reason: {sub.lastPaymentFailureReason || 'Card payment declined'}
                  </div>
                  <div className="text-neutral-500 text-[11px] font-mono mt-0.5">
                    Next Automated Retry Date: {sub.nextPaymentRetryDate || 'Billing Day'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-neutral-900 text-sm">
                    ${sub.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Subscriptions Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-neutral-900">Your Active Subscriptions</h2>

        {activeSubs.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-xs text-neutral-500">
            No active subscriptions running right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeSubs.map((sub) => {
              const plan = store.getPlanById(sub.planId);

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-neutral-900">
                          {sub.subNumber}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800'
                              : sub.status === 'past_due'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {sub.status === 'past_due' ? 'Past Due (Retrying)' : sub.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900 mt-1">{sub.planName}</div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-neutral-400 block text-[10px]">
                          Next Billing Date:
                        </span>
                        <span className="text-neutral-800 font-semibold">
                          {sub.nextBillingDate}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-400 block text-[10px]">Recurring Total:</span>
                        <span className="text-sm font-bold text-neutral-900">
                          ${sub.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lines Overview */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Enrolled Products & Seats
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sub.lines.map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-neutral-900">{l.productName}</div>
                            {l.variantName && (
                              <div className="text-[10px] text-neutral-500">{l.variantName}</div>
                            )}
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-neutral-500">Qty {l.quantity}</span>
                            <div className="font-bold text-neutral-900">${l.amount.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons Switcher: Customers switch on and off! */}
                  <div className="pt-4 border-t border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-900 block">
                          Self-Service Add-ons (Switch On/Off)
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          Turn optional capabilities on or off. Next invoice reflects updates automatically.
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addonProducts.map((addon) => {
                        const isEnrolled = sub.lines.some((l) => l.productId === addon.id);

                        return (
                          <div
                            key={addon.id}
                            className={`p-3 rounded-lg border transition-colors flex items-center justify-between text-xs ${
                              isEnrolled
                                ? 'bg-indigo-50/50 border-indigo-200'
                                : 'bg-neutral-50 border-neutral-200'
                            }`}
                          >
                            <div className="pr-3">
                              <div className="font-semibold text-neutral-900">{addon.name}</div>
                              <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                +${addon.salesPrice}/mo
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleAddon(sub.id, addon.id, isEnrolled)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                                isEnrolled
                                  ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              {isEnrolled ? (
                                <>
                                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-4 h-4 text-neutral-400" />
                                  <span>Turn On</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plan Policy Controls for Customer */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <div className="text-neutral-500 text-[11px]">
                      Policy: {plan?.allowPause ? 'Pause permitted' : 'Pause locked'} ·{' '}
                      {plan?.allowEarlyClose ? 'Cancel allowed' : 'Fixed contract'}
                    </div>

                    <div className="flex items-center gap-2">
                      {plan?.allowPause && (
                        <button
                          onClick={() => handlePauseResume(sub)}
                          className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-neutral-700 font-semibold"
                        >
                          {sub.status === 'paused' ? 'Resume Subscription' : 'Pause Temporarily'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoices & Receipts for This Customer */}
      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <h2 className="text-sm font-bold text-neutral-900">Your Invoices & Receipts</h2>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Date Issued</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Invoice Total</th>
                  <th className="py-2.5 px-4 text-right">Balance Due</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {myInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-neutral-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-neutral-600">{inv.issueDate}</td>
                    <td
                      className={`py-3 px-4 ${
                        inv.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-neutral-700'
                      }`}
                    >
                      {inv.dueDate}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      {inv.status === 'paid' ? (
                        <span className="text-emerald-700 font-semibold">Paid</span>
                      ) : inv.status === 'overdue' ? (
                        <span className="text-rose-600 font-bold">Overdue</span>
                      ) : (
                        <span className="text-neutral-800 font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-neutral-800">
                      ${inv.totalAmount.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right tabular-nums font-bold ${
                        inv.balanceDue > 0 ? 'text-rose-700' : 'text-neutral-400'
                      }`}
                    >
                      ${inv.balanceDue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {inv.balanceDue > 0 ? (
                        <button
                          onClick={() => handleOpenPay(inv)}
                          className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition-colors"
                        >
                          Pay Online
                        </button>
                      ) : (
                        <span className="text-neutral-400 text-xs">Receipt Saved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pay Online Modal */}
      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Online Invoice Settlement</h3>
                <p className="text-xs text-neutral-500">
                  Instant card charge for {selectedInvoice.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex justify-between text-neutral-500">
                  <span>Invoice Total:</span>
                  <span className="font-mono">${selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-900 font-bold mt-1">
                  <span>Balance Due Now:</span>
                  <span className="font-mono text-rose-600">
                    ${selectedInvoice.balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Amount to Pay ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={selectedInvoice.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 border border-neutral-200 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Payment Method
                </label>
                <div className="p-3 border border-neutral-200 rounded-lg flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-neutral-700" />
                  <div className="flex-1">
                    <span className="font-medium text-neutral-900 block">
                      Corporate Visa ending in 4242
                    </span>
                    <span className="text-[10px] text-neutral-400">Exp 09/29 · Stripe Verified</span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPay}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Pay ${payAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
