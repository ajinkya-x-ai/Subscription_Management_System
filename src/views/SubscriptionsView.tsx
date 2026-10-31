import React, { useState } from 'react';
import { store } from '../services/store';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionLine,
  PaymentTerms,
  Product,
  Plan,
  QuotationTemplate,
  Role,
} from '../types';
import {
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  XCircle,
  FileText,
  Percent,
  Trash2,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface SubscriptionsViewProps {
  currentRole: Role;
  onNavigateToInvoice: (invoiceId: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  currentRole,
  onNavigateToInvoice,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form state for creating a new quote/subscription
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net_30');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<
    Array<{
      id: string;
      productId: string;
      variantId?: string;
      quantity: number;
    }>
  >([]);

  const subscriptions = store.getSubscriptions();
  const products = store.getProducts();
  const plans = store.getPlans();
  const templates = store.getQuotationTemplates();
  const users = store.getUsers();
  const customers = users.filter((u) => u.role === 'customer');
  const defaultTax = store.getDefaultTaxRule();

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch =
      sub.subNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApplyTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    setSelectedPlanId(tmpl.planId);
    setValidityDays(tmpl.defaultValidityDays);
    setPaymentTerms(tmpl.paymentTerms);
    if (tmpl.notes) setNotes(tmpl.notes);

    setLineItems(
      tmpl.lines.map((l) => ({
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
      }))
    );
  };

  const handleAddLine = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setLineItems([
      ...lineItems,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: firstProd.id,
        variantId: firstProd.variants[0]?.id,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    setLineItems(lineItems.filter((l) => l.id !== id));
  };

  const calculateFormTotals = () => {
    const linesWithPrice = lineItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.id === item.variantId);
      const unitPrice = (prod?.salesPrice || 0) + (variant?.priceAdjustment || 0);
      const gross = unitPrice * item.quantity;
      return {
        ...item,
        productName: prod?.name || 'Unknown',
        variantName: variant?.name,
        unitPrice,
        taxRate: defaultTax.ratePct,
        amount: gross,
      };
    });

    const subtotal = linesWithPrice.reduce((acc, l) => acc + l.amount, 0);

    let discountDeduction = 0;
    if (appliedDiscountCode) {
      const dummyLines: SubscriptionLine[] = linesWithPrice.map((l) => ({
        id: l.id,
        productId: l.productId,
        productName: l.productName,
        variantId: l.variantId,
        variantName: l.variantName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        discountPct: 0,
        amount: l.amount,
      }));
      const evalRes = store.evaluateDiscount(appliedDiscountCode, dummyLines, startDate);
      if (evalRes.valid) {
        discountDeduction = evalRes.deduction;
      }
    }

    const netTaxable = Math.max(0, subtotal - discountDeduction);
    const taxTotal = Math.round(((netTaxable * defaultTax.ratePct) / 100) * 100) / 100;
    const totalAmount = Math.round((netTaxable + taxTotal) * 100) / 100;

    return {
      subtotal,
      discountDeduction,
      taxTotal,
      totalAmount,
      linesWithPrice,
    };
  };

  const handleCreateSubscription = (initialStatus: SubscriptionStatus) => {
    const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
    const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
    const { subtotal, discountDeduction, taxTotal, totalAmount, linesWithPrice } =
      calculateFormTotals();

    // Expiry date calculation
    const expDate = new Date(startDate);
    expDate.setDate(expDate.getDate() + (validityDays || 30));

    const subscriptionLines: SubscriptionLine[] = linesWithPrice.map((l) => ({
      id: `sline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: l.productId,
      productName: l.productName,
      variantId: l.variantId,
      variantName: l.variantName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      discountPct: 0,
      amount: l.amount,
    }));

    const newSub = store.createSubscription({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      companyName: customer.companyName || customer.name,
      planId: plan.id,
      planName: plan.name,
      billingFrequency: plan.billingFrequency,
      status: initialStatus,
      startDate,
      expiryDate: expDate.toISOString().slice(0, 10),
      nextBillingDate: startDate,
      paymentTerms,
      lines: subscriptionLines,
      appliedDiscountCode: appliedDiscountCode || undefined,
      discountAmountTotal: discountDeduction,
      subtotal,
      taxTotal,
      totalAmount,
      notes,
    });

    setIsCreateModalOpen(false);
    setSelectedSub(newSub);
    setActionMessage(
      `Created ${newSub.subNumber} in ${initialStatus.toUpperCase()} stage for ${newSub.customerName}.`
    );
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleStatusTransition = (subId: string, targetStatus: SubscriptionStatus) => {
    const res = store.updateSubscriptionStatus(subId, targetStatus);
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(null), 3500);
    // Refresh selected sub
    const updated = store.getSubscriptionById(subId);
    if (updated) setSelectedSub(updated);
  };

  const formCalculations = calculateFormTotals();

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <span className="text-emerald-700 font-semibold">Active</span>;
      case 'past_due':
        return <span className="text-rose-700 font-bold">Past Due (Retrying)</span>;
      case 'quotation':
        return <span className="text-indigo-700 font-semibold">Quotation Sent</span>;
      case 'draft':
        return <span className="text-neutral-500 font-medium">Draft</span>;
      case 'confirmed':
        return <span className="text-blue-700 font-semibold">Confirmed</span>;
      case 'paused':
        return <span className="text-amber-700 font-semibold">Paused</span>;
      case 'closed':
        return <span className="text-neutral-400 font-medium">Closed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionMessage && (
        <div className="bg-neutral-900 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400">
            ×
          </button>
        </div>
      )}

      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Subscriptions & Quotation Pipeline
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Turn customer quotes into confirmed recurring subscriptions, manage stages and policies.
          </p>
        </div>

        <button
          onClick={() => {
            // Default setup for modal
            if (templates[0]) {
              handleApplyTemplate(templates[0].id);
            } else {
              handleAddLine();
            }
            if (customers[0]) setSelectedCustomerId(customers[0].id);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Quote / Subscription</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'All Subscriptions' },
            { id: 'active', label: 'Active' },
            { id: 'past_due', label: 'Past Due' },
            { id: 'quotation', label: 'Quotations' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'draft', label: 'Draft' },
            { id: 'paused', label: 'Paused' },
            { id: 'closed', label: 'Closed' },
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

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, customer, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Subscription #</th>
                <th className="py-2.5 px-4">Customer / Company</th>
                <th className="py-2.5 px-4">Plan & Frequency</th>
                <th className="py-2.5 px-4">Current Stage</th>
                <th className="py-2.5 px-4">Next Billing Date</th>
                <th className="py-2.5 px-4 text-right">Contract Amount</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {filteredSubscriptions.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`cursor-pointer transition-colors ${
                    selectedSub?.id === sub.id ? 'bg-neutral-100/70' : 'hover:bg-neutral-50'
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-neutral-900">{sub.subNumber}</td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-neutral-900">{sub.customerName}</div>
                    <div className="text-[11px] text-neutral-500">{sub.companyName}</div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="text-neutral-800 font-medium">{sub.planName}</div>
                    <div className="text-[11px] text-neutral-400 capitalize">
                      {sub.billingFrequency} · {sub.lines.length} lines
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans">{getStatusBadge(sub.status)}</td>
                  <td className="py-3 px-4 text-neutral-700">{sub.nextBillingDate}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-900">
                    ${sub.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <span className="text-neutral-400 hover:text-neutral-900 text-xs font-medium">
                      Inspect →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Subscription Detail Drawer / Modal */}
      {selectedSub && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-neutral-900">
                  {selectedSub.subNumber}
                </span>
                <span className="text-xs">{getStatusBadge(selectedSub.status)}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {selectedSub.customerName} · {selectedSub.companyName} ({selectedSub.customerEmail})
              </div>
            </div>

            {/* Lifecycle Progression Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedSub.status === 'draft' && (
                <button
                  onClick={() => handleStatusTransition(selectedSub.id, 'quotation')}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Send Quotation to Customer</span>
                </button>
              )}

              {selectedSub.status === 'quotation' && (
                <>
                  <button
                    onClick={() => handleStatusTransition(selectedSub.id, 'confirmed')}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Confirm Order</span>
                  </button>
                  <button
                    onClick={() => handleStatusTransition(selectedSub.id, 'closed')}
                    className="px-3 py-1.5 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-medium rounded-lg transition-colors"
                  >
                    Decline / Close
                  </button>
                </>
              )}

              {selectedSub.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusTransition(selectedSub.id, 'active')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Activate Subscription</span>
                </button>
              )}

              {selectedSub.status === 'active' && (
                <>
                  <button
                    onClick={() => handleStatusTransition(selectedSub.id, 'paused')}
                    className="px-3 py-1.5 border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={() => {
                      const res = store.markSubscriptionAsPastDue(
                        selectedSub.id,
                        'Card Charge Declined (Insufficient Funds)'
                      );
                      setActionMessage(res.message);
                      setSelectedSub(store.getSubscriptionById(selectedSub.id) || null);
                    }}
                    className="px-2.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors"
                    title="Simulate a failed billing attempt to test dunning"
                  >
                    Simulate Payment Failure
                  </button>
                  <button
                    onClick={() => handleStatusTransition(selectedSub.id, 'closed')}
                    className="px-3 py-1.5 border border-neutral-200 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors"
                  >
                    Close Early
                  </button>
                </>
              )}

              {selectedSub.status === 'past_due' && (
                <>
                  <button
                    onClick={() => {
                      const res = store.retryPaymentForSubscription(
                        selectedSub.id,
                        new Date().toISOString().slice(0, 10),
                        'success'
                      );
                      setActionMessage(res.message);
                      setSelectedSub(store.getSubscriptionById(selectedSub.id) || null);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Recover & Restore Active</span>
                  </button>
                  <button
                    onClick={() => {
                      const res = store.retryPaymentForSubscription(
                        selectedSub.id,
                        new Date().toISOString().slice(0, 10)
                      );
                      setActionMessage(res.message);
                      setSelectedSub(store.getSubscriptionById(selectedSub.id) || null);
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>Run Gateway Retry</span>
                  </button>
                  <button
                    onClick={() => handleStatusTransition(selectedSub.id, 'paused')}
                    className="px-3 py-1.5 border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-medium rounded-lg transition-colors"
                  >
                    Pause
                  </button>
                </>
              )}

              {selectedSub.status === 'paused' && (
                <button
                  onClick={() => handleStatusTransition(selectedSub.id, 'active')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Subscription</span>
                </button>
              )}

              <button
                onClick={() => setSelectedSub(null)}
                className="px-2.5 py-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>

          {/* Past Due Alert Banner */}
          {selectedSub.status === 'past_due' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-rose-900">
                  Account Past Due — Dunning Stage Attempt #{selectedSub.paymentFailureCount || 1}
                </div>
                <div className="text-rose-800 mt-0.5">
                  Failure Reason: {selectedSub.lastPaymentFailureReason || 'Card payment declined'}
                </div>
                <div className="text-rose-700 text-[11px] font-mono mt-1">
                  Next Scheduled Retry: {selectedSub.nextPaymentRetryDate || 'Ready on next billing day'} · Last Attempt: {selectedSub.lastPaymentAttemptDate || 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Details Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-neutral-400 block">Plan:</span>
              <span className="font-semibold text-neutral-900">{selectedSub.planName}</span>
            </div>
            <div>
              <span className="text-neutral-400 block">Cadence / Terms:</span>
              <span className="font-semibold text-neutral-900 capitalize">
                {selectedSub.billingFrequency} · {selectedSub.paymentTerms.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block">Contract Window:</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {selectedSub.startDate} to {selectedSub.expiryDate}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block">Next Billing Cycle:</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {selectedSub.nextBillingDate}
              </span>
            </div>
          </div>

          {/* Lines Table */}
          <div className="border border-neutral-100 rounded-lg overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-600 border-b border-neutral-100">
              Contract Product Lines & Variant Options
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50/50 text-neutral-400 border-b border-neutral-100">
                <tr>
                  <th className="py-2 px-4">Product</th>
                  <th className="py-2 px-4">Variant Modifier</th>
                  <th className="py-2 px-4 text-center">Qty</th>
                  <th className="py-2 px-4 text-right">Unit Price</th>
                  <th className="py-2 px-4 text-right">Tax Rate</th>
                  <th className="py-2 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {selectedSub.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-4 font-sans font-medium text-neutral-900">
                      {l.productName}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-neutral-600">
                      {l.variantName || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">{l.quantity}</td>
                    <td className="py-2.5 px-4 text-right">${l.unitPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right">{l.taxRate}%</td>
                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900">
                      ${l.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-4">
            <div className="text-xs text-neutral-500">
              {selectedSub.notes && <div>Notes: {selectedSub.notes}</div>}
              {selectedSub.appliedDiscountCode && (
                <div className="text-indigo-600 font-medium">
                  Applied Rule: {selectedSub.appliedDiscountCode} (-${selectedSub.discountAmountTotal})
                </div>
              )}
            </div>

            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal:</span>
                <span>${selectedSub.subtotal.toFixed(2)}</span>
              </div>
              {selectedSub.discountAmountTotal ? (
                <div className="flex justify-between text-indigo-600">
                  <span>Discount:</span>
                  <span>-${selectedSub.discountAmountTotal.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-neutral-500">
                <span>Estimated Tax:</span>
                <span>${selectedSub.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-neutral-900 pt-1.5 border-t border-neutral-200 text-sm">
                <span>Contract Total:</span>
                <span>${selectedSub.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Quote / Subscription Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Prepare New Quote or Subscription
                </h3>
                <p className="text-xs text-neutral-500">
                  Select a pre-built template or build a custom line configuration for a customer.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Template Selector Bar */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Start from Quotation Template (Optional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleApplyTemplate(tmpl.id)}
                    className={`p-2.5 rounded-lg text-left text-xs border transition-colors ${
                      selectedTemplateId === tmpl.id
                        ? 'border-neutral-900 bg-white shadow-xs font-semibold'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-600'
                    }`}
                  >
                    <div className="truncate font-medium">{tmpl.name}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Valid for {tmpl.defaultValidityDays} days
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer & Plan Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Customer Account
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.companyName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Billing Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.basePrice}/{p.billingFrequency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Start Date & Validity Window
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                  />
                  <div className="flex items-center gap-1 border border-neutral-200 rounded-lg px-2 text-xs">
                    <span className="text-neutral-400">Valid:</span>
                    <input
                      type="number"
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      className="w-12 text-center font-mono focus:outline-none"
                    />
                    <span className="text-neutral-400">days</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                >
                  <option value="due_upon_receipt">Due Upon Receipt</option>
                  <option value="net_15">Net 15 Days</option>
                  <option value="net_30">Net 30 Days</option>
                  <option value="net_60">Net 60 Days</option>
                </select>
              </div>
            </div>

            {/* Line Items Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">
                  Product Lines & Variant Selection
                </span>
                <button
                  onClick={handleAddLine}
                  className="text-xs font-medium text-neutral-900 hover:text-neutral-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
                    >
                      {/* Product select */}
                      <div className="flex-1 min-w-[180px]">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newPId = e.target.value;
                            const newProd = products.find((p) => p.id === newPId);
                            setLineItems(
                              lineItems.map((l) =>
                                l.id === item.id
                                  ? {
                                      ...l,
                                      productId: newPId,
                                      variantId: newProd?.variants[0]?.id,
                                    }
                                  : l
                              )
                            );
                          }}
                          className="w-full p-1.5 bg-white border border-neutral-200 rounded text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.salesPrice})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Variant Select (if available) */}
                      {prod?.variants && prod.variants.length > 0 && (
                        <div className="flex-1 min-w-[160px]">
                          <select
                            value={item.variantId}
                            onChange={(e) => {
                              const newVId = e.target.value;
                              setLineItems(
                                lineItems.map((l) =>
                                  l.id === item.id ? { ...l, variantId: newVId } : l
                                )
                              );
                            }}
                            className="w-full p-1.5 bg-white border border-neutral-200 rounded text-xs"
                          >
                            {prod.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.priceAdjustment >= 0 ? `+` : ``}${v.priceAdjustment})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-400">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setLineItems(
                              lineItems.map((l) =>
                                l.id === item.id ? { ...l, quantity: val } : l
                              )
                            );
                          }}
                          className="w-14 p-1.5 border border-neutral-200 rounded font-mono text-center"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveLine(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                        title="Remove line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discount Code & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Discount Code Rule (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. VOLUME10, ENTERPRISE500, ODOOPROMO"
                  value={appliedDiscountCode}
                  onChange={(e) => setAppliedDiscountCode(e.target.value.toUpperCase())}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono uppercase"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Rules test seat quantity and minimum spend thresholds.
                </span>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Quotation Notes
                </label>
                <input
                  type="text"
                  placeholder="Special SLA guarantees, deployment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Real-time Calculated Total Bar */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
              <div className="space-y-0.5">
                <div className="text-neutral-500 font-mono">
                  Subtotal: ${formCalculations.subtotal.toFixed(2)}
                </div>
                {formCalculations.discountDeduction > 0 && (
                  <div className="text-indigo-600 font-semibold font-mono">
                    Discount Deduction: -${formCalculations.discountDeduction.toFixed(2)}
                  </div>
                )}
                <div className="text-neutral-500 font-mono">
                  Standard Tax ({defaultTax.ratePct}%): ${formCalculations.taxTotal.toFixed(2)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold font-mono text-neutral-900 tabular-nums">
                  Total Contract: ${formCalculations.totalAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-neutral-400">
                  Ready to send or save as draft
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateSubscription('draft')}
                className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-lg"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleCreateSubscription('quotation')}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Send as Quotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
