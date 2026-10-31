import React, { useState } from 'react';
import { store } from '../services/store';
import { QuotationTemplate, PaymentTerms, Role } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Package,
} from 'lucide-react';

interface QuotationTemplatesViewProps {
  currentRole: Role;
  onUseTemplate: (templateId: string) => void;
}

export const QuotationTemplatesView: React.FC<QuotationTemplatesViewProps> = ({
  currentRole,
  onUseTemplate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [planId, setPlanId] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net_30');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<
    Array<{ productId: string; variantId?: string; quantity: number }>
  >([]);

  const templates = store.getQuotationTemplates();
  const products = store.getProducts();
  const plans = store.getPlans();

  const handleAddLine = () => {
    const firstP = products[0];
    if (!firstP) return;
    setLines([
      ...lines,
      {
        productId: firstP.id,
        variantId: firstP.variants[0]?.id,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleCreateTemplate = () => {
    if (!name.trim()) return;

    const selectedPlan = plans.find((p) => p.id === planId) || plans[0];

    const newTmpl = store.addQuotationTemplate({
      name: name.trim(),
      description: description.trim(),
      planId: selectedPlan ? selectedPlan.id : 'plan-erp-yearly',
      defaultValidityDays: Number(validityDays) || 30,
      paymentTerms,
      notes,
      lines: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
      })),
    });

    setIsModalOpen(false);
    setNotification(`Template "${newTmpl.name}" created and available for sales reps.`);
    setTimeout(() => setNotification(null), 3500);

    // Reset
    setName('');
    setDescription('');
    setNotes('');
    setLines([]);
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
            Quotation Templates Library
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Standardized product bundles and default payment terms for sales reps to build offers rapidly.
          </p>
        </div>

        {currentRole !== 'customer' && (
          <button
            onClick={() => {
              if (plans[0]) setPlanId(plans[0].id);
              if (lines.length === 0) handleAddLine();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quotation Template</span>
          </button>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tmpl) => {
          const plan = plans.find((p) => p.id === tmpl.planId);

          return (
            <div
              key={tmpl.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-neutral-900">{tmpl.name}</h3>
                  <span className="font-mono text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded shrink-0">
                    {tmpl.defaultValidityDays}d Validity
                  </span>
                </div>

                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  {tmpl.description}
                </p>

                {/* Plan and Terms */}
                <div className="mt-3 py-2 border-t border-b border-neutral-100 text-xs text-neutral-500 flex justify-between font-mono">
                  <span>Plan: {plan?.name || 'Standard'}</span>
                  <span className="capitalize">{tmpl.paymentTerms.replace('_', ' ')}</span>
                </div>

                {/* Line Items */}
                <div className="mt-3 space-y-1.5">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Included Lines ({tmpl.lines.length})
                  </div>
                  {tmpl.lines.map((line, idx) => {
                    const prod = products.find((p) => p.id === line.productId);
                    const variant = prod?.variants.find((v) => v.id === line.variantId);

                    return (
                      <div
                        key={idx}
                        className="text-xs p-2 rounded bg-neutral-50 border border-neutral-100 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-neutral-800">
                            {prod?.name || 'Product'}
                          </span>
                          {variant && (
                            <span className="text-[10px] text-indigo-700 block">
                              Variant: {variant.name} (+${variant.priceAdjustment})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-neutral-600 text-xs font-semibold">
                          ×{line.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={() => onUseTemplate(tmpl.id)}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Build Quote From This Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Create Reusable Quotation Template
                </h3>
                <p className="text-xs text-neutral-500">
                  Sales reps will be able to select this template to pre-fill quote lines.
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
                <label className="font-semibold text-neutral-700 block mb-1">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Tier-1 Rollout Package"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of who this template is intended for..."
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Default Plan</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
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

              {/* Product Lines */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 block">Pre-filled Product Lines</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-neutral-900 hover:text-neutral-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-center gap-2 text-xs"
                      >
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newPId = e.target.value;
                            const newP = products.find((p) => p.id === newPId);
                            const updated = [...lines];
                            updated[idx] = {
                              productId: newPId,
                              variantId: newP?.variants[0]?.id,
                              quantity: item.quantity,
                            };
                            setLines(updated);
                          }}
                          className="flex-1 p-1.5 bg-white border border-neutral-200 rounded text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        {prod?.variants && prod.variants.length > 0 && (
                          <select
                            value={item.variantId}
                            onChange={(e) => {
                              const updated = [...lines];
                              updated[idx].variantId = e.target.value;
                              setLines(updated);
                            }}
                            className="flex-1 p-1.5 bg-white border border-neutral-200 rounded text-xs"
                          >
                            {prod.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} (+${v.priceAdjustment})
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="flex items-center gap-1">
                          <span className="text-neutral-400">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...lines];
                              updated[idx].quantity = Math.max(1, Number(e.target.value));
                              setLines(updated);
                            }}
                            className="w-14 p-1.5 bg-white border border-neutral-200 rounded text-center font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-neutral-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
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
                onClick={handleCreateTemplate}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
