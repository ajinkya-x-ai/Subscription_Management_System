import React, { useState } from 'react';
import { store } from '../services/store';
import {
  Subscription,
  BillingBatchLog,
  DunningScheduleConfig,
  DunningAttemptLog,
} from '../types';
import {
  CalendarCheck,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FileText,
  DollarSign,
  RotateCcw,
  SlidersHorizontal,
  Mail,
  AlertCircle,
  Pause,
  XCircle,
  History,
  ShieldAlert,
} from 'lucide-react';

interface BillingDayViewProps {
  onNavigateToInvoices: () => void;
  onViewInvoiceDetail: (invoiceId: string) => void;
}

export const BillingDayView: React.FC<BillingDayViewProps> = ({
  onNavigateToInvoices,
  onViewInvoiceDetail,
}) => {
  // Target billing date for simulation
  const [selectedBillingDate, setSelectedBillingDate] = useState('2026-11-01');
  const [activeTab, setActiveTab] = useState<'recurring' | 'dunning' | 'config'>('recurring');

  // Recurring batch state
  const [isRecurringRunning, setIsRecurringRunning] = useState(false);
  const [lastBatchResult, setLastBatchResult] = useState<{
    invoicesCreated: number;
    skippedAlreadyBilled: number;
    totalAmountBilled: number;
    invoiceNumbers: string[];
  } | null>(null);

  // Dunning retry batch state
  const [isDunningRunning, setIsDunningRunning] = useState(false);
  const [dunningSimulationMode, setDunningSimulationMode] = useState<
    'auto' | 'all_success' | 'all_fail'
  >('auto');
  const [lastDunningResult, setLastDunningResult] = useState<{
    evaluatedCount: number;
    recoveredCount: number;
    failedCount: number;
    autoPausedOrClosedCount: number;
    totalRecoveredAmount: number;
    logs: DunningAttemptLog[];
  } | null>(null);

  // Config modal state
  const [dunningConfig, setDunningConfig] = useState<DunningScheduleConfig>(
    store.getDunningConfig()
  );
  const [notification, setNotification] = useState<string | null>(null);

  const eligibleSubscriptions = store.getBillingEligibleSubscriptions(selectedBillingDate);
  const allActiveSubscriptions = store
    .getSubscriptions()
    .filter((s) => s.status === 'active');
  const pastDueSubscriptions = store.getPastDueSubscriptions();
  const retryEligibleSubscriptions = store.getRetryEligibleSubscriptions(selectedBillingDate);
  const batchLogs = store.getBatchLogs();
  const dunningLogs = store.getDunningLogs();

  const handleExecuteRecurringBatch = () => {
    setIsRecurringRunning(true);
    setTimeout(() => {
      const res = store.runBillingBatch(selectedBillingDate);
      setIsRecurringRunning(false);
      setLastBatchResult(res);
      setNotification(`Generated ${res.invoicesCreated} recurring invoices successfully.`);
      setTimeout(() => setNotification(null), 4000);
    }, 600);
  };

  const handleExecuteDunningRetries = () => {
    setIsDunningRunning(true);
    setTimeout(() => {
      const res = store.runDunningRetriesBatch(selectedBillingDate, dunningSimulationMode);
      setIsDunningRunning(false);
      setLastDunningResult(res);
      setNotification(
        `Dunning retry run completed: ${res.recoveredCount} recovered ($${res.totalRecoveredAmount.toFixed(
          2
        )}), ${res.failedCount} failed.`
      );
      setTimeout(() => setNotification(null), 5000);
    }, 700);
  };

  const handleSingleRetry = (subId: string, forceSuccess?: boolean) => {
    try {
      const res = store.retryPaymentForSubscription(
        subId,
        selectedBillingDate,
        forceSuccess ? 'success' : undefined
      );
      setNotification(res.message);
      setTimeout(() => setNotification(null), 4500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveDunningConfig = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateDunningConfig(dunningConfig);
    setNotification('Dunning schedule configuration updated and saved.');
    setTimeout(() => setNotification(null), 3500);
  };

  const estimatedBatchTotal = eligibleSubscriptions.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalAtRiskAmount = pastDueSubscriptions.reduce((acc, s) => acc + s.totalAmount, 0);

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Automated Billing Day & Payment Retry Engine
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Run scheduled recurring billing batches and automate dunning retries for past-due accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg">
            <span className="text-neutral-500">Target Billing Date:</span>
            <input
              type="date"
              value={selectedBillingDate}
              onChange={(e) => {
                setSelectedBillingDate(e.target.value);
                setLastBatchResult(null);
                setLastDunningResult(null);
              }}
              className="bg-transparent font-mono text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('recurring')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'recurring'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Recurring Invoicing Batch</span>
          {eligibleSubscriptions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-900 text-white font-mono">
              {eligibleSubscriptions.length} due
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dunning')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'dunning'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
          <span>Payment Retries & Dunning</span>
          {retryEligibleSubscriptions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-600 text-white font-mono">
              {retryEligibleSubscriptions.length} retry due
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`pb-2.5 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'config'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
          <span>Configure Dunning Schedule</span>
        </button>
      </div>

      {/* TAB 1: RECURRING INVOICING BATCH */}
      {activeTab === 'recurring' && (
        <div className="space-y-6">
          {/* Batch Result Alert */}
          {lastBatchResult && (
            <div className="bg-emerald-900 text-white rounded-xl p-5 shadow-sm border border-emerald-800 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Recurring Billing Batch Executed Successfully!
                    </h3>
                    <p className="text-xs text-emerald-200 mt-1">
                      Generated {lastBatchResult.invoicesCreated} invoices for a total of $
                      {lastBatchResult.totalAmountBilled.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                      . {lastBatchResult.skippedAlreadyBilled} subscriptions were safely skipped (already billed for this cycle).
                    </p>

                    {lastBatchResult.invoiceNumbers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-[11px] text-emerald-300 self-center">
                          Created Invoices:
                        </span>
                        {lastBatchResult.invoiceNumbers.map((num) => (
                          <span
                            key={num}
                            className="px-2 py-0.5 bg-emerald-800/80 rounded font-mono text-xs text-white"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={onNavigateToInvoices}
                  className="px-3 py-1.5 bg-white text-emerald-950 text-xs font-semibold rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap ml-4 shrink-0 flex items-center gap-1.5"
                >
                  <span>View All Invoices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Execution Console Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Idempotent Billing Protection Active</span>
                </div>
                <h2 className="text-lg font-bold text-neutral-900 mt-1">
                  Ready to Run Billing Batch for {selectedBillingDate}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  The engine automatically checks customer addresses, line item units, automated tax rules, and volume discounts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExecuteRecurringBatch}
                  disabled={isRecurringRunning || eligibleSubscriptions.length === 0}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap ${
                    eligibleSubscriptions.length === 0
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer'
                  }`}
                >
                  {isRecurringRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-300" />
                      <span>Processing Subscriptions...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 text-emerald-400" />
                      <span>
                        Execute Batch ({eligibleSubscriptions.length} Subscriptions Due)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Batch Summary Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="text-xs text-neutral-500 font-medium">Subscriptions Due</div>
                <div className="text-2xl font-bold text-neutral-900 font-mono mt-0.5 tabular-nums">
                  {eligibleSubscriptions.length}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Out of {allActiveSubscriptions.length} total active subscriptions
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="text-xs text-neutral-500 font-medium">Estimated Batch Total</div>
                <div className="text-2xl font-bold text-neutral-900 font-mono mt-0.5 tabular-nums">
                  ${estimatedBatchTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Includes line taxes and pre-calculated discounts
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="text-xs text-neutral-500 font-medium">Duplicate Protection</div>
                <div className="text-2xl font-bold text-emerald-600 font-mono mt-0.5">
                  100% Guarded
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Never bills twice or skips a valid cycle
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions Queued for Invoicing Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Subscriptions Queued for Invoicing
                </h3>
                <p className="text-xs text-neutral-500">
                  Active subscriptions with next billing date on or prior to {selectedBillingDate}
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                {eligibleSubscriptions.length} items eligible
              </span>
            </div>

            {eligibleSubscriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                <CheckCircle2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <div className="font-semibold text-neutral-700">No Subscriptions Due for This Date</div>
                <p className="text-neutral-400 mt-1">
                  All active subscriptions have already been invoiced for this period or are scheduled for later dates.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-4">Subscription #</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Plan & Cadence</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4">Active Discount</th>
                      <th className="py-2.5 px-4 text-right">Pre-tax Subtotal</th>
                      <th className="py-2.5 px-4 text-right">Tax</th>
                      <th className="py-2.5 px-4 text-right">Total Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {eligibleSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-neutral-900">{sub.subNumber}</td>
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-neutral-900">{sub.customerName}</div>
                          <div className="text-[11px] text-neutral-500">{sub.companyName}</div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <div className="text-neutral-800">{sub.planName}</div>
                          <div className="text-[11px] text-neutral-400 capitalize">
                            {sub.billingFrequency} · {sub.paymentTerms.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-700 font-medium">
                          {sub.nextBillingDate}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {sub.appliedDiscountCode ? (
                            <span className="text-[11px] font-semibold text-indigo-700">
                              {sub.appliedDiscountCode} (-${sub.discountAmountTotal})
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-neutral-600">
                          ${sub.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-neutral-600">
                          ${sub.taxTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-900">
                          ${sub.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historical Batch Logs */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">
              Historical Automated Invoicing Runs
            </h3>
            <div className="space-y-2">
              {batchLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-neutral-900">
                        Billing Cycle {log.billingDate}
                      </span>
                      <div className="text-[11px] text-neutral-500">
                        Evaluated {log.subscriptionsEvaluated} subscriptions · Generated {log.invoicesGenerated} invoices · Skipped {log.skippedAlreadyBilled} duplicates
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-neutral-900 tabular-nums">
                      ${log.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED PAYMENT RETRIES & DUNNING */}
      {activeTab === 'dunning' && (
        <div className="space-y-6">
          {/* Last Dunning Run Outcome Alert */}
          {lastDunningResult && (
            <div
              className={`rounded-xl p-5 shadow-sm border animate-in fade-in duration-200 ${
                lastDunningResult.recoveredCount > 0
                  ? 'bg-neutral-900 text-white border-neutral-800'
                  : 'bg-rose-950 text-white border-rose-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Automated Payment Retry Batch Completed
                    </h3>
                    <p className="text-xs text-neutral-300 mt-1">
                      Evaluated {lastDunningResult.evaluatedCount} past-due subscriptions. Successfully recovered{' '}
                      <strong className="text-emerald-400 font-mono">
                        ${lastDunningResult.totalRecoveredAmount.toFixed(2)}
                      </strong>{' '}
                      across {lastDunningResult.recoveredCount} accounts. {lastDunningResult.failedCount} attempts
                      failed and advanced to the next scheduled dunning step.
                    </p>
                    {lastDunningResult.autoPausedOrClosedCount > 0 && (
                      <div className="text-xs text-amber-300 font-medium mt-1">
                        {lastDunningResult.autoPausedOrClosedCount} subscription(s) reached maximum retry limit and were automatically paused/closed per policy.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dunning Action & Metric Strip */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Configurable Automated Dunning Engine</span>
                </div>
                <h2 className="text-lg font-bold text-neutral-900 mt-1">
                  Automated Payment Recovery for Past-Due Subscriptions
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Retries failed card charges on a {dunningConfig.steps.length}-stage interval schedule ({dunningConfig.steps.map((s) => `+${s.intervalDays}d`).join(', ')}). Automatically restores recovered subscriptions or pauses delinquent accounts.
                </p>
              </div>

              {/* Execution Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={dunningSimulationMode}
                  onChange={(e) => setDunningSimulationMode(e.target.value as any)}
                  className="px-2.5 py-2 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                  title="Payment Gateway Retry Simulation Mode"
                >
                  <option value="auto">Realistic Gateway Simulation (~65% Recovery)</option>
                  <option value="all_success">Force All Succeeded (Demo Recovery)</option>
                  <option value="all_fail">Force All Failed (Advance Dunning Step)</option>
                </select>

                <button
                  onClick={handleExecuteDunningRetries}
                  disabled={isDunningRunning || retryEligibleSubscriptions.length === 0}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap ${
                    retryEligibleSubscriptions.length === 0
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-rose-700 hover:bg-rose-800 text-white cursor-pointer'
                  }`}
                >
                  {isDunningRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Retrying Charges...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>
                        Run Payment Retries ({retryEligibleSubscriptions.length} Due for {selectedBillingDate})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dunning Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="text-xs text-neutral-500 font-medium">Total Past-Due Subscriptions</div>
                <div className="text-2xl font-bold text-rose-600 font-mono mt-0.5 tabular-nums">
                  {pastDueSubscriptions.length}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Currently in dunning retry cycle</div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="text-xs text-neutral-500 font-medium">Retries Due on {selectedBillingDate}</div>
                <div className="text-2xl font-bold text-neutral-900 font-mono mt-0.5 tabular-nums">
                  {retryEligibleSubscriptions.length}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Eligible for automated execution</div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="text-xs text-neutral-500 font-medium">At-Risk Subscription Revenue</div>
                <div className="text-2xl font-bold text-neutral-900 font-mono mt-0.5 tabular-nums">
                  ${totalAtRiskAmount.toFixed(2)}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Uncollected pending retry</div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="text-xs text-neutral-500 font-medium">Configured Dunning Policy</div>
                <div className="text-sm font-bold text-neutral-900 mt-1">
                  {dunningConfig.maxRetryAttempts} Retries Max
                </div>
                <div className="text-[11px] text-neutral-500 capitalize mt-0.5">
                  Final Action: {dunningConfig.finalAction.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions with Past Due Status Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Subscriptions in 'Past Due' Status
                </h3>
                <p className="text-xs text-neutral-500">
                  Track failed payment attempts, error codes, and scheduled dunning retry intervals.
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                {pastDueSubscriptions.length} past due accounts
              </span>
            </div>

            {pastDueSubscriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="font-semibold text-neutral-800">No Past-Due Subscriptions!</div>
                <p className="text-neutral-400 mt-1">
                  All subscription payments are up to date and healthy.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-4">Subscription #</th>
                      <th className="py-2.5 px-4">Customer Account</th>
                      <th className="py-2.5 px-4">Contract Plan</th>
                      <th className="py-2.5 px-4">Last Failure Reason</th>
                      <th className="py-2.5 px-4 text-center">Dunning Stage</th>
                      <th className="py-2.5 px-4">Next Retry Scheduled</th>
                      <th className="py-2.5 px-4 text-right">Amount Due</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {pastDueSubscriptions.map((sub) => {
                      const isDueToday =
                        !sub.nextPaymentRetryDate || sub.nextPaymentRetryDate <= selectedBillingDate;

                      return (
                        <tr key={sub.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-neutral-900">{sub.subNumber}</td>
                          <td className="py-3 px-4 font-sans">
                            <div className="font-semibold text-neutral-900">{sub.customerName}</div>
                            <div className="text-[11px] text-neutral-500">{sub.customerEmail}</div>
                          </td>
                          <td className="py-3 px-4 font-sans text-neutral-700">
                            <div>{sub.planName}</div>
                            <div className="text-[11px] text-neutral-400 capitalize">
                              {sub.billingFrequency}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-sans text-rose-700 max-w-xs">
                            <div className="font-medium truncate" title={sub.lastPaymentFailureReason}>
                              {sub.lastPaymentFailureReason || 'Payment Declined'}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              Last Attempt: {sub.lastPaymentAttemptDate || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-sans">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              Attempt {sub.paymentFailureCount || 1} of {dunningConfig.maxRetryAttempts}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-semibold ${
                                isDueToday ? 'text-rose-700 font-bold' : 'text-neutral-700'
                              }`}
                            >
                              {sub.nextPaymentRetryDate || 'Immediate'}
                            </span>
                            {isDueToday && (
                              <span className="block text-[10px] text-rose-600 font-sans font-medium">
                                Ready to retry
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-900">
                            ${sub.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSingleRetry(sub.id, false)}
                                className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-medium flex items-center gap-1"
                                title="Run automated retry using gateway"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Retry Now</span>
                              </button>
                              <button
                                onClick={() => handleSingleRetry(sub.id, true)}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-medium"
                                title="Force simulated successful recovery"
                              >
                                Recover
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dunning Audit History & Customer Notices */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Dunning Retry Audit Log & Automated Customer Notices
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {dunningLogs.length} attempts recorded
              </span>
            </div>

            <div className="space-y-2">
              {dunningLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    log.status === 'succeeded'
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {log.status === 'succeeded' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900">
                          {log.subNumber}
                        </span>
                        <span className="text-neutral-500">· {log.customerName}</span>
                        <span
                          className={`font-semibold text-[10px] uppercase px-1.5 py-0.2 rounded ${
                            log.status === 'succeeded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Attempt #{log.attemptNumber} {log.status}
                        </span>
                      </div>
                      <div className="text-neutral-600 mt-1">{log.actionTaken}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-neutral-900">
                      ${log.amount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURE DUNNING SCHEDULE */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
          <div className="pb-4 border-b border-neutral-100">
            <h2 className="text-base font-bold text-neutral-900">
              Configurable Dunning Schedule & Automated Policy Rules
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Customize the intervals between payment retry attempts, customer notification templates, and the final action when maximum retries are reached.
            </p>
          </div>

          <form onSubmit={handleSaveDunningConfig} className="space-y-6 text-xs">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div>
                <span className="font-bold text-neutral-900 text-sm block">
                  Automated Payment Retry Engine
                </span>
                <span className="text-neutral-500 text-xs">
                  When enabled, subscriptions with failed payments transition to 'past_due' and follow this schedule.
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dunningConfig.enabled}
                  onChange={(e) =>
                    setDunningConfig({ ...dunningConfig, enabled: e.target.checked })
                  }
                  className="rounded text-neutral-900 w-4 h-4"
                />
                <span className="font-semibold text-neutral-900 text-xs">Enabled</span>
              </label>
            </div>

            {/* Configurable Schedule Steps */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-neutral-900 block">
                Retry Stages & Interval Timeline
              </span>

              <div className="space-y-3">
                {dunningConfig.steps.map((stepConfig, idx) => (
                  <div
                    key={stepConfig.step}
                    className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-mono text-[10px] font-bold">
                          {stepConfig.step}
                        </span>
                        <span className="font-bold text-neutral-900">
                          Retry Attempt #{stepConfig.step} Stage
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Retry Interval:</span>
                        <div className="flex items-center gap-1 border border-neutral-200 rounded px-2 py-1">
                          <span className="text-neutral-400">+</span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={stepConfig.intervalDays}
                            onChange={(e) => {
                              const updatedSteps = [...dunningConfig.steps];
                              updatedSteps[idx] = {
                                ...updatedSteps[idx],
                                intervalDays: Math.max(1, Number(e.target.value)),
                              };
                              setDunningConfig({ ...dunningConfig, steps: updatedSteps });
                            }}
                            className="w-10 text-center font-mono font-bold focus:outline-none"
                          />
                          <span className="text-neutral-500">days</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                      <div>
                        <label className="font-semibold text-neutral-600 block mb-1">
                          Step Name / Internal Title
                        </label>
                        <input
                          type="text"
                          value={stepConfig.notificationTitle}
                          onChange={(e) => {
                            const updatedSteps = [...dunningConfig.steps];
                            updatedSteps[idx] = {
                              ...updatedSteps[idx],
                              notificationTitle: e.target.value,
                            };
                            setDunningConfig({ ...dunningConfig, steps: updatedSteps });
                          }}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-neutral-600 block mb-1">
                          Automated Email Notice Subject
                        </label>
                        <input
                          type="text"
                          value={stepConfig.emailSubjectTemplate}
                          onChange={(e) => {
                            const updatedSteps = [...dunningConfig.steps];
                            updatedSteps[idx] = {
                              ...updatedSteps[idx],
                              emailSubjectTemplate: e.target.value,
                            };
                            setDunningConfig({ ...dunningConfig, steps: updatedSteps });
                          }}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Exhausted Action */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
              <span className="font-bold text-neutral-900 block text-xs">
                Post-Dunning Exhaustion Policy
              </span>
              <p className="text-neutral-500 text-xs">
                When an account fails all {dunningConfig.maxRetryAttempts} scheduled retry attempts, execute the following automatic system action:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'auto_pause' as const,
                    title: 'Auto-Pause Subscription (Recommended)',
                    desc: 'Temporarily suspends service access. Easily reactivated once new card is provided.',
                  },
                  {
                    id: 'auto_close' as const,
                    title: 'Auto-Close / Terminate Contract',
                    desc: 'Permanently closes subscription. Customer must re-subscribe or request new quote.',
                  },
                  {
                    id: 'keep_past_due' as const,
                    title: 'Retain as Past Due',
                    desc: 'Keeps subscription in past due state for manual intervention by sales & finance leads.',
                  },
                ].map((act) => (
                  <label
                    key={act.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex flex-col justify-between ${
                      dunningConfig.finalAction === act.id
                        ? 'bg-white border-neutral-900 shadow-xs'
                        : 'bg-white border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="finalAction"
                          checked={dunningConfig.finalAction === act.id}
                          onChange={() =>
                            setDunningConfig({ ...dunningConfig, finalAction: act.id })
                          }
                          className="text-neutral-900"
                        />
                        <span className="font-bold text-neutral-900 text-xs">{act.title}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDunningConfig(store.getDunningConfig());
                  setActiveTab('dunning');
                }}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save Dunning Configuration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
