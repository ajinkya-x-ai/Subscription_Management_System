import React, { useState } from 'react';
import { store } from '../services/store';
import {
  Product,
  ProductType,
  ProductVariant,
  Plan,
  BillingFrequency,
  Role,
} from '../types';
import {
  Package,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  Tag,
  DollarSign,
} from 'lucide-react';

interface ProductsAndPlansViewProps {
  currentRole: Role;
}

export const ProductsAndPlansView: React.FC<ProductsAndPlansViewProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'plans'>('products');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCode, setProdCode] = useState('');
  const [prodType, setProdType] = useState<ProductType>('software_license');
  const [salesPrice, setSalesPrice] = useState<number>(300);
  const [costPrice, setCostPrice] = useState<number>(100);
  const [prodDesc, setProdDesc] = useState('');
  const [prodNotes, setProdNotes] = useState('');
  const [variants, setVariants] = useState<
    Array<{ name: string; codeModifier: string; priceAdjustment: number; notes?: string }>
  >([
    {
      name: 'Odoo Brand Connector & Sync',
      codeModifier: 'ODOO',
      priceAdjustment: 560, // Exactly as in prompt!
      notes: 'Seamless two-way synchronization bridge with Odoo apps.',
    },
  ]);

  // New Plan Form State
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planProductId, setPlanProductId] = useState('');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
  const [basePrice, setBasePrice] = useState<number>(300);
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('2028-12-31');
  const [autoCloseOnEnd, setAutoCloseOnEnd] = useState(false);
  const [allowEarlyClose, setAllowEarlyClose] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [autoRenew, setAutoRenew] = useState(true);

  const products = store.getProducts();
  const plans = store.getPlans();

  const handleAddVariantRow = () => {
    setVariants([
      ...variants,
      {
        name: '',
        codeModifier: '',
        priceAdjustment: 0,
      },
    ]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleCreateProduct = () => {
    if (!prodName.trim()) return;

    const formattedVariants: ProductVariant[] = variants
      .filter((v) => v.name.trim())
      .map((v, i) => ({
        id: `var-${Date.now()}-${i}`,
        name: v.name.trim(),
        codeModifier: v.codeModifier.trim().toUpperCase() || `VAR${i + 1}`,
        priceAdjustment: Number(v.priceAdjustment) || 0,
        notes: v.notes,
      }));

    const newProd = store.addProduct({
      name: prodName.trim(),
      code: prodCode.trim() || `BL-${Date.now().toString().slice(-4)}`,
      type: prodType,
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice),
      description: prodDesc,
      notes: prodNotes,
      active: true,
      variants: formattedVariants,
    });

    setIsProductModalOpen(false);
    setNotification(`Product "${newProd.name}" launched with ${formattedVariants.length} variants!`);
    setTimeout(() => setNotification(null), 3500);

    // Reset form
    setProdName('');
    setProdDesc('');
    setProdNotes('');
  };

  const handleCreatePlan = () => {
    if (!planName.trim()) return;
    const selectedProd = products.find((p) => p.id === planProductId) || products[0];

    const newPlan = store.addPlan({
      name: planName.trim(),
      description: planDesc.trim(),
      productId: selectedProd ? selectedProd.id : 'prod-erp-core',
      billingFrequency,
      basePrice: Number(basePrice),
      minQuantity: Number(minQuantity) || 1,
      startDate,
      endDate: endDate || undefined,
      autoCloseOnEnd,
      allowEarlyClose,
      allowPause,
      autoRenew,
      active: true,
    });

    setIsPlanModalOpen(false);
    setNotification(`New plan "${newPlan.name}" configured and active.`);
    setTimeout(() => setNotification(null), 3500);

    // Reset form
    setPlanName('');
    setPlanDesc('');
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
            Products, Variants & Subscription Plans
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure software products, price deltas (e.g. brand sync variants), and plan lifecycle policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'products' ? (
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product & Variants</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (products[0]) {
                  setPlanProductId(products[0].id);
                  setBasePrice(products[0].salesPrice);
                }
                setIsPlanModalOpen(true);
              }}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Launch New Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Product Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Subscription Plans & Policies ({plans.length})</span>
        </button>
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 block">{p.code}</span>
                    <h3 className="text-sm font-bold text-neutral-900">{p.name}</h3>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 capitalize">
                    {p.type.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{p.description}</p>

                {p.notes && (
                  <div className="text-[11px] text-neutral-500 italic mt-1.5">Note: {p.notes}</div>
                )}

                {/* Variants List */}
                {p.variants.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      Configured Product Variants ({p.variants.length})
                    </div>
                    <div className="space-y-1.5">
                      {p.variants.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between text-xs p-2 rounded bg-neutral-50 border border-neutral-100"
                        >
                          <div>
                            <span className="font-medium text-neutral-800">{v.name}</span>
                            {v.notes && (
                              <span className="text-[10px] text-neutral-400 block">{v.notes}</span>
                            )}
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              v.priceAdjustment > 0
                                ? 'text-indigo-600'
                                : v.priceAdjustment < 0
                                ? 'text-emerald-600'
                                : 'text-neutral-500'
                            }`}
                          >
                            {v.priceAdjustment >= 0 ? `+` : ``}${v.priceAdjustment}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Margins Footer */}
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-neutral-400 text-[11px]">Cost: </span>
                  <span className="text-neutral-600">${p.costPrice}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px]">Sales Base: </span>
                  <span className="font-bold text-neutral-900 text-sm">${p.salesPrice}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plans Tab Content */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((pl) => {
            const product = products.find((p) => p.id === pl.productId);

            return (
              <div
                key={pl.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">{pl.name}</h3>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Base Product: {product?.name || 'Software License'}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 capitalize">
                      {pl.billingFrequency}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{pl.description}</p>

                  {/* Plan Lifecycle Policy Tags */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
                    <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Plan Lifecycle Policy Controls
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-700">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pl.autoRenew ? 'bg-emerald-500' : 'bg-neutral-300'
                          }`}
                        />
                        <span>Auto-renew: {pl.autoRenew ? 'Yes' : 'No'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-700">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pl.allowPause ? 'bg-emerald-500' : 'bg-rose-400'
                          }`}
                        />
                        <span>Allow Pause: {pl.allowPause ? 'Yes' : 'No'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-700">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pl.allowEarlyClose ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                        />
                        <span>Allow Early Close: {pl.allowEarlyClose ? 'Yes' : 'No'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-700">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pl.autoCloseOnEnd ? 'bg-indigo-500' : 'bg-neutral-300'
                          }`}
                        />
                        <span>Auto-close on End: {pl.autoCloseOnEnd ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-400 font-mono mt-1">
                      Available: {pl.startDate} {pl.endDate ? `to ${pl.endDate}` : 'onwards'} · Min Qty: {pl.minQuantity}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">Plan Rate:</span>
                  <span className="font-bold text-neutral-900 text-sm">
                    ${pl.basePrice} / {pl.billingFrequency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product & Variants Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Add New Product & Variants</h3>
                <p className="text-xs text-neutral-500">
                  Define sales price, cost price, and brand/edition variant price deltas.
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Brightloop Supply Chain Optimizer"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Product SKU / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. BL-SC-07"
                    value={prodCode}
                    onChange={(e) => setProdCode(e.target.value)}
                    className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Product Type</label>
                  <select
                    value={prodType}
                    onChange={(e) => setProdType(e.target.value as ProductType)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                  >
                    <option value="software_license">Software License</option>
                    <option value="addon">Add-on (Switch on/off)</option>
                    <option value="service">Service / SLA</option>
                    <option value="module">Add-in Module</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Sales Price ($)</label>
                  <input
                    type="number"
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Comprehensive description of the product capabilities..."
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>

              {/* Variants Builder */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-900 block">
                      Product Variants (e.g. by Brand)
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      e.g., choosing the Odoo brand adds 560 to the price
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-xs text-neutral-900 hover:text-neutral-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        placeholder="Variant name (e.g. Odoo Brand Connector)"
                        value={v.name}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[i].name = e.target.value;
                          setVariants(updated);
                        }}
                        className="flex-1 p-1.5 bg-white border border-neutral-200 rounded text-xs"
                      />

                      <input
                        type="text"
                        placeholder="Code Modifier (e.g. ODOO)"
                        value={v.codeModifier}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[i].codeModifier = e.target.value;
                          setVariants(updated);
                        }}
                        className="w-24 p-1.5 bg-white border border-neutral-200 rounded text-xs font-mono"
                      />

                      <div className="flex items-center gap-1">
                        <span className="text-neutral-400">+$:</span>
                        <input
                          type="number"
                          placeholder="Price Delta"
                          value={v.priceAdjustment}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[i].priceAdjustment = Number(e.target.value);
                            setVariants(updated);
                          }}
                          className="w-20 p-1.5 bg-white border border-neutral-200 rounded text-xs font-mono text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariantRow(i)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProduct}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Launch Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launch New Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Launch New Plan</h3>
                <p className="text-xs text-neutral-500">
                  Set cadence (daily/weekly/monthly/yearly), quantities, and lifecycle rules.
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Annual Commitment"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Base Product</label>
                  <select
                    value={planProductId}
                    onChange={(e) => {
                      setPlanProductId(e.target.value);
                      const p = products.find((prod) => prod.id === e.target.value);
                      if (p) setBasePrice(p.salesPrice);
                    }}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Base Price (${billingFrequency})
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Minimum Quantity (Seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Available From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Available Until
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Policy Controls Checkboxes */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <span className="font-bold text-neutral-900 block text-xs">
                  Plan Policy Rules
                </span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="rounded text-neutral-900"
                  />
                  <span>Auto-renew automatically at end of period</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPause}
                    onChange={(e) => setAllowPause(e.target.checked)}
                    className="rounded text-neutral-900"
                  />
                  <span>Allow subscription to be paused temporarily</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowEarlyClose}
                    onChange={(e) => setAllowEarlyClose(e.target.checked)}
                    className="rounded text-neutral-900"
                  />
                  <span>Allow early termination before end date</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCloseOnEnd}
                    onChange={(e) => setAutoCloseOnEnd(e.target.checked)}
                    className="rounded text-neutral-900"
                  />
                  <span>Auto-close on its own when end date arrives</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Publish Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
