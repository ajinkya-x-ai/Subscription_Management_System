import React, { useState } from 'react';
import { store } from '../services/store';
import {
  DiscountRule,
  DiscountType,
  DiscountScope,
  TaxRule,
  Role,
} from '../types';
import {
  Percent,
  Plus,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DiscountsAndTaxesViewProps {
  currentRole: Role;
}

export const DiscountsAndTaxesView: React.FC<DiscountsAndTaxesViewProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<'discounts' | 'taxes'>('discounts');
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Discount Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState<number>(10);
  const [minPurchase, setMinPurchase] = useState<number>(0);
  const [minQuantity, setMinQuantity] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('2027-12-31');
  const [maxUsage, setMaxUsage] = useState<number>(50);
  const [scope, setScope] = useState<DiscountScope>('entire_subscription');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // New Tax Form State
  const [taxName, setTaxName] = useState('');
  const [ratePct, setRatePct] = useState<number>(20);
  const [region, setRegion] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const discounts = store.getDiscountRules();
  const taxRules = store.getTaxRules();
  const products = store.getProducts();

  // Guard for admin only
  if (currentRole !== 'admin') {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center max-w-lg mx-auto mt-12">
        <Shield className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-neutral-900">Administrator Access Restricted</h3>
        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
          Only the administrator can configure core discount rules, tax rates, and billing policies.
          Please switch to Elena Vance (Admin) via the top persona dropdown to configure these rules.
        </p>
      </div>
    );
  }

  const handleCreateDiscount = () => {
    if (!code.trim() || !name.trim()) return;

    const newDisc = store.addDiscountRule({
      code,
      name,
      type,
      value: Number(value),
      minPurchaseAmount: Number(minPurchase) || undefined,
      minQuantity: Number(minQuantity) || undefined,
      startDate,
      endDate,
      maxUsage: Number(maxUsage) || 100,
      scope,
      targetProductIds: scope === 'specific_products' ? selectedProductIds : undefined,
      active: true,
    });

    setIsDiscountModalOpen(false);
    setNotification(`Discount rule "${newDisc.code}" created and active.`);
    setTimeout(() => setNotification(null), 3500);

    // Reset
    setCode('');
    setName('');
  };

  const handleCreateTax = () => {
    if (!taxName.trim()) return;

    const newTax = store.addTaxRule({
      name: taxName.trim(),
      ratePct: Number(ratePct),
      region: region.trim() || 'Global',
      isDefault,
      active: true,
    });

    setIsTaxModalOpen(false);
    setNotification(`Tax rule "${newTax.name}" (${newTax.ratePct}%) created.`);
    setTimeout(() => setNotification(null), 3500);

    setTaxName('');
    setRegion('');
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
            <span>Admin Restricted Configuration</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight mt-0.5">
            Discounts & Automatic Tax Engine
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Admin rules for automated discounts, seat quantity volume thresholds, usage limits, and regional tax brackets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'discounts' ? (
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Create Discount Rule</span>
            </button>
          ) : (
            <button
              onClick={() => setIsTaxModalOpen(true)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tax Rule</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('discounts')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'discounts'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Discount Rules ({discounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('taxes')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'taxes'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Automated Tax Rules ({taxRules.length})</span>
        </button>
      </div>

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {discounts.map((disc) => {
            const usagePct = Math.min(100, Math.round((disc.usageCount / disc.maxUsage) * 100));

            return (
              <div
                key={disc.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-neutral-900 text-white">
                        {disc.code}
                      </span>
                      <h3 className="text-sm font-bold text-neutral-900 mt-2">{disc.name}</h3>
                    </div>
                    <span className="font-mono text-sm font-bold text-indigo-700">
                      {disc.type === 'percentage' ? `${disc.value}% OFF` : `$${disc.value} FLAT`}
                    </span>
                  </div>

                  {/* Conditions & Criteria */}
                  <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Scope:</span>
                      <span className="font-medium text-neutral-800 capitalize">
                        {disc.scope.replace('_', ' ')}
                      </span>
                    </div>

                    {disc.minQuantity ? (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Min Seats Threshold:</span>
                        <span className="font-mono font-semibold text-neutral-800">
                          {disc.minQuantity}+ seats
                        </span>
                      </div>
                    ) : null}

                    {disc.minPurchaseAmount ? (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Min Purchase:</span>
                        <span className="font-mono font-semibold text-neutral-800">
                          ${disc.minPurchaseAmount.toLocaleString()}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Validity:</span>
                      <span className="font-mono text-neutral-700">
                        {disc.startDate} to {disc.endDate}
                      </span>
                    </div>
                  </div>

                  {/* Usage Tracker Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-neutral-400">Usage Limit:</span>
                      <span className="font-semibold text-neutral-900">
                        {disc.usageCount} / {disc.maxUsage} used ({usagePct}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-neutral-900 h-full rounded-full transition-all"
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-neutral-400 italic">
                  Automatically applied on next invoices without manual intervention.
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Taxes Tab */}
      {activeTab === 'taxes' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Rule Name</th>
                <th className="py-2.5 px-4">Jurisdiction / Region</th>
                <th className="py-2.5 px-4 text-right">Tax Rate %</th>
                <th className="py-2.5 px-4 text-center">Default Rule</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {taxRules.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-neutral-900">{t.name}</td>
                  <td className="py-3 px-4 text-neutral-600">{t.region}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 tabular-nums">
                    {t.ratePct}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    {t.isDefault ? (
                      <span className="text-emerald-700 font-semibold text-[11px]">Default</span>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-emerald-700 font-medium">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Create Discount Rule</h3>
                <p className="text-xs text-neutral-500">
                  Fixed amount or percentage, seat minimums, validity window, and usage cap.
                </p>
              </div>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Promo Code (Uppercase)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VOLUME20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Rule Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 20-Seat Enterprise Incentive"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DiscountType)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Discount Value ({type === 'percentage' ? '%' : '$'})
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Min Seats Quantity Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for none"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Min Order Spend ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for none"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Maximum Times Usable
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Discount Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as DiscountScope)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                  >
                    <option value="entire_subscription">Whole Subscription</option>
                    <option value="specific_products">Specific Products Only</option>
                  </select>
                </div>
              </div>

              {scope === 'specific_products' && (
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Select Target Products
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto border border-neutral-200 rounded-lg p-2">
                    {products.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds([...selectedProductIds, p.id]);
                            } else {
                              setSelectedProductIds(
                                selectedProductIds.filter((id) => id !== p.id)
                              );
                            }
                          }}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDiscount}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save Discount Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Tax Modal */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Add Tax Rule</h3>
              <button
                onClick={() => setIsTaxModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Tax Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. California State Tax (7.25%)"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Tax Rate Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ratePct}
                  onChange={(e) => setRatePct(Number(e.target.value))}
                  className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Jurisdiction / Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. United States (California)"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <span>Set as default tax rule for new quotes and subscriptions</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsTaxModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTax}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save Tax Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
