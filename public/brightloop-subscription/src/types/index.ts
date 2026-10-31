export type Role = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyName?: string;
  title?: string;
  avatarColor?: string;
  createdAt: string;
}

export type ProductType = 'software_license' | 'addon' | 'service' | 'module';

export interface ProductVariant {
  id: string;
  name: string;
  codeModifier: string;
  priceAdjustment: number; // e.g. +560 for Odoo Brand
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  type: ProductType;
  salesPrice: number;
  costPrice: number;
  description: string;
  notes?: string;
  active: boolean;
  variants: ProductVariant[];
  createdAt: string;
}

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Plan {
  id: string;
  name: string;
  description: string;
  productId: string;
  billingFrequency: BillingFrequency;
  basePrice: number;
  minQuantity: number;
  startDate: string;
  endDate?: string;
  // Lifecycle policy rules
  autoCloseOnEnd: boolean; // closes automatically when end date is reached
  allowEarlyClose: boolean; // can be cancelled before end
  allowPause: boolean; // can be paused temporarily
  autoRenew: boolean; // auto-renews at period end
  active: boolean;
  createdAt: string;
}

export interface QuotationTemplateLine {
  productId: string;
  variantId?: string;
  quantity: number;
  defaultDiscountPct?: number;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description: string;
  planId: string;
  defaultValidityDays: number;
  paymentTerms: PaymentTerms;
  notes?: string;
  lines: QuotationTemplateLine[];
}

export type SubscriptionStatus =
  | 'draft'
  | 'quotation'
  | 'confirmed'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'closed';

export type PaymentTerms = 'due_upon_receipt' | 'net_15' | 'net_30' | 'net_60';

export interface SubscriptionLine {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 20 for 20%
  discountPct: number; // percentage discount on line
  amount: number;
}

export interface Subscription {
  id: string;
  subNumber: string; // e.g. SUB-2026-0042
  customerId: string;
  customerName: string;
  customerEmail: string;
  companyName: string;
  planId: string;
  planName: string;
  billingFrequency: BillingFrequency;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  nextBillingDate: string;
  lastBilledDate?: string;
  paymentTerms: PaymentTerms;
  lines: SubscriptionLine[];
  appliedDiscountCode?: string;
  discountAmountTotal?: number;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  // Dunning & Automated Retry tracking fields
  paymentFailureCount?: number;
  lastPaymentAttemptDate?: string;
  nextPaymentRetryDate?: string;
  lastPaymentFailureReason?: string;
  dunningStep?: number;
}

export type DunningFinalAction = 'auto_pause' | 'auto_close' | 'keep_past_due';

export interface DunningStepConfig {
  step: number;
  intervalDays: number; // days after previous failure to retry
  notificationTitle: string;
  emailSubjectTemplate: string;
}

export interface DunningScheduleConfig {
  enabled: boolean;
  maxRetryAttempts: number;
  steps: DunningStepConfig[];
  finalAction: DunningFinalAction; // action when all retries are exhausted
}

export interface DunningAttemptLog {
  id: string;
  timestamp: string;
  subscriptionId: string;
  subNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerName: string;
  customerEmail: string;
  attemptNumber: number;
  status: 'succeeded' | 'failed';
  amount: number;
  failureReason?: string;
  actionTaken: string;
}

export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLine {
  id: string;
  productId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountPct: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0104
  subscriptionId?: string;
  subNumber?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: PaymentTerms;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  sentAt?: string;
  notes?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  createdAt: string;
}

export interface TaxRule {
  id: string;
  name: string;
  ratePct: number;
  region: string;
  isDefault: boolean;
  active: boolean;
}

export type DiscountType = 'percentage' | 'fixed_amount';
export type DiscountScope = 'entire_subscription' | 'specific_products';

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  type: DiscountType;
  value: number; // 15 for 15%, or 500 for $500
  minPurchaseAmount?: number;
  minQuantity?: number;
  startDate: string;
  endDate: string;
  maxUsage: number;
  usageCount: number;
  scope: DiscountScope;
  targetProductIds?: string[];
  active: boolean;
}

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'ach_debit' | 'stripe' | 'check';

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  referenceNotes: string;
  recordedBy: string;
  createdAt: string;
}

export interface BillingBatchLog {
  id: string;
  timestamp: string;
  billingDate: string;
  subscriptionsEvaluated: number;
  invoicesGenerated: number;
  skippedAlreadyBilled: number;
  totalBilled: number;
  invoiceNumbers: string[];
}
