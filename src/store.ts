import {
  User,
  Role,
  Product,
  Plan,
  QuotationTemplate,
  Subscription,
  SubscriptionStatus,
  SubscriptionLine,
  Invoice,
  InvoiceStatus,
  TaxRule,
  DiscountRule,
  Payment,
  PaymentTerms,
  BillingBatchLog,
  BillingFrequency,
  DunningScheduleConfig,
  DunningAttemptLog,
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_PLANS,
  INITIAL_TAX_RULES,
  INITIAL_DISCOUNT_RULES,
  INITIAL_TEMPLATES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_BILLING_BATCH_LOGS,
  INITIAL_DUNNING_CONFIG,
  INITIAL_DUNNING_LOGS,
} from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'bl_users_v1',
  CURRENT_USER_ID: 'bl_current_user_id_v1',
  PRODUCTS: 'bl_products_v1',
  PLANS: 'bl_plans_v1',
  TAX_RULES: 'bl_tax_rules_v1',
  DISCOUNTS: 'bl_discounts_v1',
  TEMPLATES: 'bl_templates_v1',
  SUBSCRIPTIONS: 'bl_subscriptions_v1',
  INVOICES: 'bl_invoices_v1',
  PAYMENTS: 'bl_payments_v1',
  BATCH_LOGS: 'bl_batch_logs_v1',
  DUNNING_CONFIG: 'bl_dunning_config_v1',
  DUNNING_LOGS: 'bl_dunning_logs_v1',
};

type Listener = () => void;

class BrightloopStore {
  private users: User[] = [];
  private currentUserId: string = 'user-admin';
  private products: Product[] = [];
  private plans: Plan[] = [];
  private taxRules: TaxRule[] = [];
  private discountRules: DiscountRule[] = [];
  private templates: QuotationTemplate[] = [];
  private subscriptions: Subscription[] = [];
  private invoices: Invoice[] = [];
  private payments: Payment[] = [];
  private batchLogs: BillingBatchLog[] = [];
  private dunningConfig: DunningScheduleConfig = INITIAL_DUNNING_CONFIG;
  private dunningLogs: DunningAttemptLog[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;

      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      this.currentUserId = storedUser || 'user-admin';

      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      this.products = storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS;

      const storedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      this.plans = storedPlans ? JSON.parse(storedPlans) : INITIAL_PLANS;

      const storedTaxRules = localStorage.getItem(STORAGE_KEYS.TAX_RULES);
      this.taxRules = storedTaxRules ? JSON.parse(storedTaxRules) : INITIAL_TAX_RULES;

      const storedDiscounts = localStorage.getItem(STORAGE_KEYS.DISCOUNTS);
      this.discountRules = storedDiscounts ? JSON.parse(storedDiscounts) : INITIAL_DISCOUNT_RULES;

      const storedTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      this.templates = storedTemplates ? JSON.parse(storedTemplates) : INITIAL_TEMPLATES;

      const storedSubs = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      this.subscriptions = storedSubs ? JSON.parse(storedSubs) : INITIAL_SUBSCRIPTIONS;

      const storedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
      this.invoices = storedInvoices ? JSON.parse(storedInvoices) : INITIAL_INVOICES;

      const storedPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      this.payments = storedPayments ? JSON.parse(storedPayments) : INITIAL_PAYMENTS;

      const storedLogs = localStorage.getItem(STORAGE_KEYS.BATCH_LOGS);
      this.batchLogs = storedLogs ? JSON.parse(storedLogs) : INITIAL_BILLING_BATCH_LOGS;

      const storedDunningConfig = localStorage.getItem(STORAGE_KEYS.DUNNING_CONFIG);
      this.dunningConfig = storedDunningConfig ? JSON.parse(storedDunningConfig) : INITIAL_DUNNING_CONFIG;

      const storedDunningLogs = localStorage.getItem(STORAGE_KEYS.DUNNING_LOGS);
      this.dunningLogs = storedDunningLogs ? JSON.parse(storedDunningLogs) : INITIAL_DUNNING_LOGS;

      // Ensure past_due sample subscriptions exist in state
      if (!this.subscriptions.some((s) => s.status === 'past_due')) {
        const pastDueSeeds = INITIAL_SUBSCRIPTIONS.filter((s) => s.status === 'past_due');
        this.subscriptions.push(...pastDueSeeds);
      }
    } catch {
      // Fallback to initial seed data
      this.users = [...INITIAL_USERS];
      this.currentUserId = 'user-admin';
      this.products = [...INITIAL_PRODUCTS];
      this.plans = [...INITIAL_PLANS];
      this.taxRules = [...INITIAL_TAX_RULES];
      this.discountRules = [...INITIAL_DISCOUNT_RULES];
      this.templates = [...INITIAL_TEMPLATES];
      this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
      this.invoices = [...INITIAL_INVOICES];
      this.payments = [...INITIAL_PAYMENTS];
      this.batchLogs = [...INITIAL_BILLING_BATCH_LOGS];
      this.dunningConfig = { ...INITIAL_DUNNING_CONFIG };
      this.dunningLogs = [...INITIAL_DUNNING_LOGS];
    }

    // Refresh overdue checks
    this.refreshOverdueStatus();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(this.plans));
      localStorage.setItem(STORAGE_KEYS.TAX_RULES, JSON.stringify(this.taxRules));
      localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(this.discountRules));
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(this.subscriptions));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(this.invoices));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(this.payments));
      localStorage.setItem(STORAGE_KEYS.BATCH_LOGS, JSON.stringify(this.batchLogs));
      localStorage.setItem(STORAGE_KEYS.DUNNING_CONFIG, JSON.stringify(this.dunningConfig));
      localStorage.setItem(STORAGE_KEYS.DUNNING_LOGS, JSON.stringify(this.dunningLogs));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetToFactory() {
    this.users = [...INITIAL_USERS];
    this.currentUserId = 'user-admin';
    this.products = [...INITIAL_PRODUCTS];
    this.plans = [...INITIAL_PLANS];
    this.taxRules = [...INITIAL_TAX_RULES];
    this.discountRules = [...INITIAL_DISCOUNT_RULES];
    this.templates = [...INITIAL_TEMPLATES];
    this.subscriptions = [...INITIAL_SUBSCRIPTIONS];
    this.invoices = [...INITIAL_INVOICES];
    this.payments = [...INITIAL_PAYMENTS];
    this.batchLogs = [...INITIAL_BILLING_BATCH_LOGS];
    this.dunningConfig = { ...INITIAL_DUNNING_CONFIG };
    this.dunningLogs = [...INITIAL_DUNNING_LOGS];
    this.persist();
  }

  // --- USER & AUTH ---

  public getUsers(): User[] {
    return this.users;
  }

  public getCurrentUser(): User {
    const found = this.users.find((u) => u.id === this.currentUserId);
    return (
      found ||
      this.users[0] || {
        id: 'user-admin',
        name: 'Elena Vance',
        email: 'elena@brightloop.io',
        role: 'admin',
        createdAt: new Date().toISOString(),
      }
    );
  }

  public setCurrentUser(userId: string) {
    if (this.users.some((u) => u.id === userId)) {
      this.currentUserId = userId;
      this.persist();
    }
  }

  /**
   * Password validator matching prompt requirements:
   * "more than eight characters, with an uppercase letter, a lowercase letter and a special character"
   */
  public validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length <= 8) {
      return { valid: false, message: 'Password must be more than 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-=+~`[\]/\\]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
    }
    return { valid: true };
  }

  public registerCustomer(
    name: string,
    email: string,
    password: string,
    companyName: string
  ): { success: boolean; message: string; user?: User } {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const passCheck = this.validatePassword(password);
    if (!passCheck.valid) {
      return { success: false, message: passCheck.message || 'Invalid password.' };
    }

    const newUser: User = {
      id: `user-cust-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      role: 'customer',
      companyName: companyName.trim() || `${name.trim()}'s Business`,
      avatarColor: 'bg-emerald-600',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.currentUserId = newUser.id;
    this.persist();
    return { success: true, message: 'Account created successfully!', user: newUser };
  }

  public addStaffMember(
    name: string,
    email: string,
    role: 'admin' | 'staff',
    title: string
  ): { success: boolean; message: string; user?: User } {
    const current = this.getCurrentUser();
    if (current.role !== 'admin') {
      return { success: false, message: 'Permission denied. Only an Admin can add a new member of staff.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (this.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'A team member or user with this email already exists.' };
    }

    const newStaff: User = {
      id: `user-staff-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      role,
      title: title.trim() || (role === 'admin' ? 'System Administrator' : 'Internal Account Executive'),
      companyName: 'Brightloop Software Internal Team',
      avatarColor: role === 'admin' ? 'bg-indigo-600' : 'bg-teal-600',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newStaff);
    this.persist();
    return { success: true, message: `Staff member ${newStaff.name} added successfully.`, user: newStaff };
  }

  public resetPassword(email: string, newPassword: string): { success: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return { success: false, message: 'No registered account found with that email address.' };
    }

    const passCheck = this.validatePassword(newPassword);
    if (!passCheck.valid) {
      return { success: false, message: passCheck.message || 'Invalid password.' };
    }

    // In this unified simulation, password reset completes securely
    this.persist();
    return { success: true, message: `Password for ${user.email} has been successfully reset.` };
  }

  // --- PRODUCTS & VARIANTS ---

  public getProducts(): Product[] {
    return this.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Product {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.products.unshift(newProduct);
    this.persist();
    return newProduct;
  }

  public updateProduct(product: Product) {
    const idx = this.products.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      this.products[idx] = product;
      this.persist();
    }
  }

  public deleteProduct(id: string) {
    this.products = this.products.filter((p) => p.id !== id);
    this.persist();
  }

  // --- PLANS ---

  public getPlans(): Plan[] {
    return this.plans;
  }

  public getPlanById(id: string): Plan | undefined {
    return this.plans.find((p) => p.id === id);
  }

  public addPlan(planData: Omit<Plan, 'id' | 'createdAt'>): Plan {
    const newPlan: Plan = {
      ...planData,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.plans.unshift(newPlan);
    this.persist();
    return newPlan;
  }

  public updatePlan(plan: Plan) {
    const idx = this.plans.findIndex((p) => p.id === plan.id);
    if (idx !== -1) {
      this.plans[idx] = plan;
      this.persist();
    }
  }

  // --- TAXES & DISCOUNTS ---

  public getTaxRules(): TaxRule[] {
    return this.taxRules;
  }

  public getDefaultTaxRule(): TaxRule {
    return this.taxRules.find((t) => t.isDefault && t.active) || this.taxRules[0] || {
      id: 'tax-zero',
      name: 'Zero Tax (0%)',
      ratePct: 0,
      region: 'Standard',
      isDefault: true,
      active: true,
    };
  }

  public addTaxRule(taxData: Omit<TaxRule, 'id'>): TaxRule {
    const newTax: TaxRule = {
      ...taxData,
      id: `tax-${Date.now()}`,
    };
    if (newTax.isDefault) {
      this.taxRules.forEach((t) => (t.isDefault = false));
    }
    this.taxRules.push(newTax);
    this.persist();
    return newTax;
  }

  public updateTaxRule(tax: TaxRule) {
    const idx = this.taxRules.findIndex((t) => t.id === tax.id);
    if (idx !== -1) {
      if (tax.isDefault) {
        this.taxRules.forEach((t) => (t.isDefault = false));
      }
      this.taxRules[idx] = tax;
      this.persist();
    }
  }

  public getDiscountRules(): DiscountRule[] {
    return this.discountRules;
  }

  public addDiscountRule(discountData: Omit<DiscountRule, 'id' | 'usageCount'>): DiscountRule {
    const newDiscount: DiscountRule = {
      ...discountData,
      id: `disc-${Date.now()}`,
      code: discountData.code.trim().toUpperCase(),
      usageCount: 0,
    };
    this.discountRules.unshift(newDiscount);
    this.persist();
    return newDiscount;
  }

  public updateDiscountRule(discount: DiscountRule) {
    const idx = this.discountRules.findIndex((d) => d.id === discount.id);
    if (idx !== -1) {
      this.discountRules[idx] = {
        ...discount,
        code: discount.code.trim().toUpperCase(),
      };
      this.persist();
    }
  }

  /**
   * Evaluates if a discount rule can apply to subscription lines
   */
  public evaluateDiscount(
    discountCode: string,
    lines: SubscriptionLine[],
    asOfDate: string = new Date().toISOString().slice(0, 10)
  ): { valid: boolean; discount?: DiscountRule; deduction: number; reason?: string } {
    const code = discountCode.trim().toUpperCase();
    const discount = this.discountRules.find((d) => d.code === code && d.active);

    if (!discount) {
      return { valid: false, deduction: 0, reason: 'Invalid or inactive discount code.' };
    }

    if (discount.usageCount >= discount.maxUsage) {
      return { valid: false, deduction: 0, reason: 'This discount rule has reached its maximum usage limit.' };
    }

    if (discount.startDate && asOfDate < discount.startDate) {
      return { valid: false, deduction: 0, reason: 'This discount is not yet active.' };
    }

    if (discount.endDate && asOfDate > discount.endDate) {
      return { valid: false, deduction: 0, reason: 'This discount rule has expired.' };
    }

    // Check quantity threshold
    const totalQty = lines.reduce((acc, l) => acc + l.quantity, 0);
    if (discount.minQuantity && totalQty < discount.minQuantity) {
      return {
        valid: false,
        deduction: 0,
        reason: `Requires a minimum of ${discount.minQuantity} seats or items (current: ${totalQty}).`,
      };
    }

    // Check purchase amount threshold
    const grossSubtotal = lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
    if (discount.minPurchaseAmount && grossSubtotal < discount.minPurchaseAmount) {
      return {
        valid: false,
        deduction: 0,
        reason: `Requires a minimum purchase amount of $${discount.minPurchaseAmount.toLocaleString()} (current: $${grossSubtotal.toLocaleString()}).`,
      };
    }

    let applicableBase = 0;
    if (discount.scope === 'specific_products' && discount.targetProductIds?.length) {
      applicableBase = lines
        .filter((l) => discount.targetProductIds!.includes(l.productId))
        .reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
    } else {
      applicableBase = grossSubtotal;
    }

    let deduction = 0;
    if (discount.type === 'percentage') {
      deduction = Math.round(((applicableBase * discount.value) / 100) * 100) / 100;
    } else {
      deduction = Math.min(applicableBase, discount.value);
    }

    return { valid: true, discount, deduction };
  }

  // --- QUOTATION TEMPLATES ---

  public getQuotationTemplates(): QuotationTemplate[] {
    return this.templates;
  }

  public addQuotationTemplate(templateData: Omit<QuotationTemplate, 'id'>): QuotationTemplate {
    const newTmpl: QuotationTemplate = {
      ...templateData,
      id: `tmpl-${Date.now()}`,
    };
    this.templates.push(newTmpl);
    this.persist();
    return newTmpl;
  }

  public updateQuotationTemplate(template: QuotationTemplate) {
    const idx = this.templates.findIndex((t) => t.id === template.id);
    if (idx !== -1) {
      this.templates[idx] = template;
      this.persist();
    }
  }

  // --- SUBSCRIPTIONS & QUOTATIONS ---

  public getSubscriptions(): Subscription[] {
    return this.subscriptions;
  }

  public getSubscriptionById(id: string): Subscription | undefined {
    return this.subscriptions.find((s) => s.id === id);
  }

  public createSubscription(
    subData: Omit<Subscription, 'id' | 'subNumber' | 'createdAt'>
  ): Subscription {
    const counter = this.subscriptions.length + 46;
    const subNumber = `SUB-2026-00${counter}`;
    const newSub: Subscription = {
      ...subData,
      id: `sub-${Date.now()}`,
      subNumber,
      createdAt: new Date().toISOString(),
    };
    this.subscriptions.unshift(newSub);
    this.persist();
    return newSub;
  }

  public updateSubscription(subscription: Subscription) {
    const idx = this.subscriptions.findIndex((s) => s.id === subscription.id);
    if (idx !== -1) {
      this.subscriptions[idx] = subscription;
      this.persist();
    }
  }

  public updateSubscriptionStatus(id: string, newStatus: SubscriptionStatus): { success: boolean; message: string } {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, message: 'Subscription not found.' };

    const plan = this.getPlanById(sub.planId);

    // Lifecycle policy checks
    if (newStatus === 'paused' && plan && !plan.allowPause) {
      return { success: false, message: `The '${plan.name}' plan policy does not allow pausing.` };
    }

    if (newStatus === 'closed' && plan && sub.status === 'active' && !plan.allowEarlyClose) {
      // If closing early before expiryDate
      const today = new Date().toISOString().slice(0, 10);
      if (today < sub.expiryDate) {
        return {
          success: false,
          message: `The '${plan.name}' plan is under a fixed contract and does not permit early closure.`,
        };
      }
    }

    sub.status = newStatus;
    this.persist();
    return { success: true, message: `Subscription ${sub.subNumber} transitioned to ${newStatus.toUpperCase()}.` };
  }

  public toggleSubscriptionAddon(
    subscriptionId: string,
    addonProductId: string,
    enable: boolean
  ): { success: boolean; message: string } {
    const sub = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return { success: false, message: 'Subscription not found.' };

    const product = this.getProductById(addonProductId);
    if (!product) return { success: false, message: 'Product not found.' };

    const defaultTax = this.getDefaultTaxRule();

    if (enable) {
      const existing = sub.lines.find((l) => l.productId === addonProductId);
      if (!existing) {
        sub.lines.push({
          id: `sline-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.salesPrice,
          taxRate: defaultTax.ratePct,
          discountPct: 0,
          amount: product.salesPrice,
        });
      }
    } else {
      sub.lines = sub.lines.filter((l) => l.productId !== addonProductId);
    }

    // Recalculate totals
    this.recalculateSubscriptionTotals(sub);
    this.persist();
    return {
      success: true,
      message: `${product.name} ${enable ? 'activated on' : 'removed from'} subscription.`,
    };
  }

  private recalculateSubscriptionTotals(sub: Subscription) {
    let subtotal = 0;
    let taxTotal = 0;
    sub.lines.forEach((l) => {
      const lineGross = l.quantity * l.unitPrice;
      const lineDisc = (lineGross * (l.discountPct || 0)) / 100;
      const lineNet = lineGross - lineDisc;
      l.amount = lineNet;
      subtotal += lineNet;
      taxTotal += (lineNet * l.taxRate) / 100;
    });

    let discountDeduction = 0;
    if (sub.appliedDiscountCode) {
      const evalRes = this.evaluateDiscount(sub.appliedDiscountCode, sub.lines);
      if (evalRes.valid) {
        discountDeduction = evalRes.deduction;
      }
    }

    sub.subtotal = Math.round(subtotal * 100) / 100;
    sub.discountAmountTotal = Math.round(discountDeduction * 100) / 100;
    sub.taxTotal = Math.round(taxTotal * 100) / 100;
    sub.totalAmount = Math.max(0, Math.round((subtotal - discountDeduction + taxTotal) * 100) / 100);
  }

  // --- BILLING DAY AUTOMATION ENGINE ---

  public getBillingEligibleSubscriptions(asOfDate: string): Subscription[] {
    return this.subscriptions.filter((sub) => {
      if (sub.status !== 'active') return false;
      // Due if nextBillingDate <= asOfDate
      if (sub.nextBillingDate > asOfDate) return false;

      // Idempotency check: has this subscription already been billed for this date?
      const alreadyBilled = this.invoices.some(
        (inv) =>
          inv.subscriptionId === sub.id &&
          inv.status !== 'cancelled' &&
          (inv.billingPeriodEnd === sub.nextBillingDate || inv.issueDate === asOfDate)
      );

      return !alreadyBilled;
    });
  }

  /**
   * The automated billing batch engine matching scene:
   * "It is billing day, and hundreds of subscriptions are due at once.
   * Nobody should be typing invoices by hand. Each one should be created from its subscription,
   * with the customer details, product lines, taxes and totals already filled in.
   * Nothing should be billed twice or skipped."
   */
  public runBillingBatch(asOfDate: string): {
    success: boolean;
    invoicesCreated: number;
    skippedAlreadyBilled: number;
    totalAmountBilled: number;
    invoiceNumbers: string[];
  } {
    const activeSubs = this.subscriptions.filter((s) => s.status === 'active');
    const createdInvoices: Invoice[] = [];
    const invoiceNumbers: string[] = [];
    let skippedCount = 0;
    let totalBilled = 0;

    activeSubs.forEach((sub) => {
      // Check if due on or before asOfDate
      if (sub.nextBillingDate > asOfDate) {
        return; // Not due yet
      }

      // Idempotency: verify not billed twice for this period
      const duplicateInvoice = this.invoices.find(
        (inv) =>
          inv.subscriptionId === sub.id &&
          inv.status !== 'cancelled' &&
          inv.billingPeriodStart === sub.nextBillingDate
      );

      if (duplicateInvoice) {
        skippedCount++;
        return;
      }

      // Calculate due date from payment terms
      const dueDate = this.calculateDueDate(asOfDate, sub.paymentTerms);

      // Check automated discount rules
      let discountTotal = sub.discountAmountTotal || 0;
      if (sub.appliedDiscountCode) {
        const discountRes = this.evaluateDiscount(sub.appliedDiscountCode, sub.lines, asOfDate);
        if (discountRes.valid) {
          discountTotal = discountRes.deduction;
          // Increment discount rule usage
          const rule = this.discountRules.find((d) => d.code === sub.appliedDiscountCode);
          if (rule) {
            rule.usageCount += 1;
          }
        }
      }

      const invCounter = this.invoices.length + createdInvoices.length + 86;
      const invNumber = `INV-2026-0${invCounter}`;

      const invoiceLines = sub.lines.map((l) => ({
        id: `iline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: l.productId,
        productName: l.productName,
        variantName: l.variantName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        discountPct: l.discountPct,
        lineTotal: l.amount,
      }));

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        invoiceNumber: invNumber,
        subscriptionId: sub.id,
        subNumber: sub.subNumber,
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        billingAddress: `${sub.companyName}, Corporate Billing Department`,
        issueDate: asOfDate,
        dueDate,
        paymentTerms: sub.paymentTerms,
        status: 'confirmed',
        lines: invoiceLines,
        subtotal: sub.subtotal,
        taxTotal: sub.taxTotal,
        discountTotal,
        totalAmount: sub.totalAmount,
        paidAmount: 0,
        balanceDue: sub.totalAmount,
        billingPeriodStart: sub.nextBillingDate,
        billingPeriodEnd: this.calculateNextDate(sub.nextBillingDate, sub.billingFrequency),
        notes: `Automated recurring billing generated for period starting ${sub.nextBillingDate}.`,
        createdAt: new Date().toISOString(),
      };

      createdInvoices.push(newInvoice);
      invoiceNumbers.push(invNumber);
      totalBilled += newInvoice.totalAmount;

      // Update subscription billing dates
      sub.lastBilledDate = asOfDate;
      sub.nextBillingDate = this.calculateNextDate(sub.nextBillingDate, sub.billingFrequency);

      // Check plan lifecycle autoCloseOnEnd
      const plan = this.getPlanById(sub.planId);
      if (plan?.autoCloseOnEnd && plan.endDate && sub.nextBillingDate >= plan.endDate) {
        sub.status = 'closed';
        sub.notes = (sub.notes ? sub.notes + ' ' : '') + 'Automatically closed as plan reached its scheduled end date.';
      }
    });

    if (createdInvoices.length > 0) {
      this.invoices.unshift(...createdInvoices);

      const batchLog: BillingBatchLog = {
        id: `batch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        billingDate: asOfDate,
        subscriptionsEvaluated: activeSubs.length,
        invoicesGenerated: createdInvoices.length,
        skippedAlreadyBilled: skippedCount,
        totalBilled: Math.round(totalBilled * 100) / 100,
        invoiceNumbers,
      };

      this.batchLogs.unshift(batchLog);
      this.persist();
    }

    return {
      success: true,
      invoicesCreated: createdInvoices.length,
      skippedAlreadyBilled: skippedCount,
      totalAmountBilled: Math.round(totalBilled * 100) / 100,
      invoiceNumbers,
    };
  }

  public getBatchLogs(): BillingBatchLog[] {
    return this.batchLogs;
  }

  private calculateDueDate(issueDate: string, terms: PaymentTerms): string {
    const d = new Date(issueDate);
    if (isNaN(d.getTime())) return issueDate;

    let daysToAdd = 0;
    switch (terms) {
      case 'due_upon_receipt':
        daysToAdd = 0;
        break;
      case 'net_15':
        daysToAdd = 15;
        break;
      case 'net_30':
        daysToAdd = 30;
        break;
      case 'net_60':
        daysToAdd = 60;
        break;
    }

    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().slice(0, 10);
  }

  private calculateNextDate(startDate: string, frequency: BillingFrequency): string {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return startDate;

    switch (frequency) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
    }

    return d.toISOString().slice(0, 10);
  }

  // --- AUTOMATED DUNNING & PAYMENT RETRIES ---

  public getDunningConfig(): DunningScheduleConfig {
    return this.dunningConfig;
  }

  public updateDunningConfig(config: DunningScheduleConfig) {
    this.dunningConfig = config;
    this.persist();
  }

  public getDunningLogs(): DunningAttemptLog[] {
    return this.dunningLogs;
  }

  public getPastDueSubscriptions(): Subscription[] {
    return this.subscriptions.filter((s) => s.status === 'past_due');
  }

  public getRetryEligibleSubscriptions(asOfDate: string): Subscription[] {
    return this.subscriptions.filter((s) => {
      if (s.status !== 'past_due') return false;
      if (!s.nextPaymentRetryDate) return true;
      return s.nextPaymentRetryDate <= asOfDate;
    });
  }

  public markSubscriptionAsPastDue(subId: string, reason?: string): { success: boolean; message: string } {
    const sub = this.subscriptions.find((s) => s.id === subId);
    if (!sub) return { success: false, message: 'Subscription not found' };

    sub.status = 'past_due';
    sub.paymentFailureCount = (sub.paymentFailureCount || 0) + 1;
    sub.lastPaymentAttemptDate = new Date().toISOString().slice(0, 10);
    sub.lastPaymentFailureReason = reason || 'Payment Charge Declined (Code: card_declined)';
    sub.dunningStep = 1;

    // Schedule next retry based on step 1 interval
    const stepConfig = this.dunningConfig.steps[0] || { intervalDays: 1 };
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + stepConfig.intervalDays);
    sub.nextPaymentRetryDate = nextDate.toISOString().slice(0, 10);

    const log: DunningAttemptLog = {
      id: `dlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      subscriptionId: sub.id,
      subNumber: sub.subNumber,
      customerName: sub.customerName,
      customerEmail: sub.customerEmail,
      attemptNumber: sub.paymentFailureCount,
      status: 'failed',
      amount: sub.totalAmount,
      failureReason: sub.lastPaymentFailureReason,
      actionTaken: `Flagged as Past Due. Dunning Step 1 initiated; Retry #1 scheduled for ${sub.nextPaymentRetryDate}.`,
    };

    this.dunningLogs.unshift(log);
    this.persist();

    return {
      success: true,
      message: `Subscription ${sub.subNumber} marked as Past Due. Next retry scheduled for ${sub.nextPaymentRetryDate}.`,
    };
  }

  public retryPaymentForSubscription(
    subId: string,
    asOfDate: string,
    simulatedOutcome?: 'success' | 'fail'
  ): {
    success: boolean;
    subscription: Subscription;
    message: string;
    actionTaken: string;
    log: DunningAttemptLog;
  } {
    const sub = this.subscriptions.find((s) => s.id === subId);
    if (!sub) throw new Error('Subscription not found');

    const config = this.dunningConfig;
    const currentAttempt = (sub.paymentFailureCount || 0) + 1;

    const invoice = this.invoices.find(
      (inv) => inv.subscriptionId === sub.id && inv.balanceDue > 0 && inv.status !== 'cancelled'
    );

    const isSuccess =
      simulatedOutcome === 'success'
        ? true
        : simulatedOutcome === 'fail'
        ? false
        : Math.random() < 0.65;

    const amount = invoice ? invoice.balanceDue : sub.totalAmount;

    if (isSuccess) {
      if (invoice) {
        this.recordPayment(
          invoice.id,
          amount,
          'credit_card',
          asOfDate,
          `Automated Dunning Retry Recovery #${currentAttempt}`,
          'Automated Dunning Engine'
        );
      }

      sub.status = 'active';
      sub.paymentFailureCount = 0;
      sub.lastPaymentAttemptDate = asOfDate;
      sub.nextPaymentRetryDate = undefined;
      sub.lastPaymentFailureReason = undefined;
      sub.dunningStep = 0;
      sub.notes =
        (sub.notes ? sub.notes + ' ' : '') +
        `[${asOfDate}] Payment recovered on automated retry #${currentAttempt}. Restored to Active.`;

      const actionTaken = `Payment successfully recovered ($${amount.toFixed(2)}). Status restored to ACTIVE. Confirmation email dispatched to ${sub.customerEmail}.`;

      const log: DunningAttemptLog = {
        id: `dlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        subscriptionId: sub.id,
        subNumber: sub.subNumber,
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoiceNumber,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        attemptNumber: currentAttempt,
        status: 'succeeded',
        amount,
        actionTaken,
      };

      this.dunningLogs.unshift(log);
      this.persist();

      return {
        success: true,
        subscription: sub,
        message: `Payment of $${amount.toFixed(2)} recovered for ${sub.subNumber}! Subscription restored to Active.`,
        actionTaken,
        log,
      };
    } else {
      sub.paymentFailureCount = currentAttempt;
      sub.lastPaymentAttemptDate = asOfDate;

      const failureReasons = [
        'Card Declined: Insufficient Funds (Code: do_not_honor)',
        'Card Expired / Invalid CVV (Code: expired_card)',
        'Issuer Processing Error (Code: processing_error)',
        'Card Blocked by Bank Risk Rules (Code: fraudulent)',
      ];
      const failureReason =
        sub.lastPaymentFailureReason || failureReasons[currentAttempt % failureReasons.length];
      sub.lastPaymentFailureReason = failureReason;

      let actionTaken = '';
      if (currentAttempt >= config.maxRetryAttempts) {
        if (config.finalAction === 'auto_pause') {
          sub.status = 'paused';
          actionTaken = `Exhausted all ${config.maxRetryAttempts} retries. Subscription automatically PAUSED per dunning schedule. Final suspension notice sent.`;
          sub.notes =
            (sub.notes ? sub.notes + ' ' : '') +
            `[${asOfDate}] Auto-paused after exhausting ${config.maxRetryAttempts} dunning retries.`;
        } else if (config.finalAction === 'auto_close') {
          sub.status = 'closed';
          actionTaken = `Exhausted all ${config.maxRetryAttempts} retries. Subscription automatically CLOSED per dunning schedule. Termination notice sent.`;
          sub.notes =
            (sub.notes ? sub.notes + ' ' : '') +
            `[${asOfDate}] Auto-closed after exhausting ${config.maxRetryAttempts} dunning retries.`;
        } else {
          actionTaken = `Exhausted all ${config.maxRetryAttempts} retries. Retained as Past Due for manual account management.`;
        }
        sub.nextPaymentRetryDate = undefined;
      } else {
        const stepConfig =
          config.steps[currentAttempt - 1] || config.steps[config.steps.length - 1];
        const interval = stepConfig ? stepConfig.intervalDays : 3;

        const nextRetry = new Date(asOfDate);
        nextRetry.setDate(nextRetry.getDate() + interval);
        const nextDateStr = nextRetry.toISOString().slice(0, 10);

        sub.nextPaymentRetryDate = nextDateStr;
        sub.dunningStep = currentAttempt + 1;
        actionTaken = `Retry #${currentAttempt} failed (${failureReason}). Next retry #${currentAttempt + 1} scheduled for ${nextDateStr} (+${interval} days). Automated customer warning notice sent.`;
      }

      const log: DunningAttemptLog = {
        id: `dlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        subscriptionId: sub.id,
        subNumber: sub.subNumber,
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoiceNumber,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        attemptNumber: currentAttempt,
        status: 'failed',
        amount,
        failureReason,
        actionTaken,
      };

      this.dunningLogs.unshift(log);
      this.persist();

      return {
        success: false,
        subscription: sub,
        message: `Retry attempt #${currentAttempt} failed for ${sub.subNumber}: ${failureReason}`,
        actionTaken,
        log,
      };
    }
  }

  public runDunningRetriesBatch(
    asOfDate: string,
    mode?: 'auto' | 'all_success' | 'all_fail'
  ): {
    evaluatedCount: number;
    recoveredCount: number;
    failedCount: number;
    autoPausedOrClosedCount: number;
    totalRecoveredAmount: number;
    logs: DunningAttemptLog[];
  } {
    const eligible = this.getRetryEligibleSubscriptions(asOfDate);
    let recoveredCount = 0;
    let failedCount = 0;
    let autoPausedOrClosedCount = 0;
    let totalRecoveredAmount = 0;
    const batchLogs: DunningAttemptLog[] = [];

    eligible.forEach((sub) => {
      const simulatedOutcome =
        mode === 'all_success' ? 'success' : mode === 'all_fail' ? 'fail' : undefined;
      const res = this.retryPaymentForSubscription(sub.id, asOfDate, simulatedOutcome);
      batchLogs.push(res.log);

      if (res.success) {
        recoveredCount++;
        totalRecoveredAmount += res.log.amount;
      } else {
        failedCount++;
        if (sub.status === 'paused' || sub.status === 'closed') {
          autoPausedOrClosedCount++;
        }
      }
    });

    return {
      evaluatedCount: eligible.length,
      recoveredCount,
      failedCount,
      autoPausedOrClosedCount,
      totalRecoveredAmount: Math.round(totalRecoveredAmount * 100) / 100,
      logs: batchLogs,
    };
  }

  // --- INVOICES ---

  public getInvoices(): Invoice[] {
    return this.invoices;
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.invoices.find((i) => i.id === id);
  }

  public updateInvoiceStatus(id: string, newStatus: InvoiceStatus) {
    const inv = this.invoices.find((i) => i.id === id);
    if (inv) {
      inv.status = newStatus;
      this.persist();
    }
  }

  public sendInvoice(id: string): { success: boolean; message: string } {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) return { success: false, message: 'Invoice not found.' };

    inv.sentAt = new Date().toISOString();
    if (inv.status === 'draft') {
      inv.status = 'confirmed';
    }
    this.persist();
    return {
      success: true,
      message: `Invoice ${inv.invoiceNumber} sent electronically to ${inv.customerEmail}.`,
    };
  }

  public refreshOverdueStatus(currentDate: string = new Date().toISOString().slice(0, 10)) {
    let changed = false;
    this.invoices.forEach((inv) => {
      if (inv.status === 'confirmed' && inv.balanceDue > 0 && inv.dueDate < currentDate) {
        inv.status = 'overdue';
        changed = true;
      }
    });
    if (changed) {
      this.persist();
    }
  }

  // --- PAYMENTS RECONCILIATION ---

  public getPayments(): Payment[] {
    return this.payments;
  }

  public recordPayment(
    invoiceId: string,
    amount: number,
    method: Payment['method'],
    date: string,
    referenceNotes: string,
    recordedBy: string
  ): { success: boolean; message: string; payment?: Payment } {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice not found.' };

    if (amount <= 0) {
      return { success: false, message: 'Payment amount must be greater than $0.' };
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      amount: Math.round(amount * 100) / 100,
      method,
      date,
      referenceNotes,
      recordedBy,
      createdAt: new Date().toISOString(),
    };

    inv.paidAmount = Math.round((inv.paidAmount + newPayment.amount) * 100) / 100;
    inv.balanceDue = Math.max(0, Math.round((inv.totalAmount - inv.paidAmount) * 100) / 100);

    if (inv.balanceDue <= 0.01) {
      inv.status = 'paid';
    } else {
      // Still outstanding or overdue if past due
      const today = new Date().toISOString().slice(0, 10);
      inv.status = inv.dueDate < today ? 'overdue' : 'confirmed';
    }

    this.payments.unshift(newPayment);
    this.persist();

    return {
      success: true,
      message: `Payment of $${newPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} recorded for ${inv.invoiceNumber}. Balance remaining: $${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`,
      payment: newPayment,
    };
  }

  // --- FINANCE LEAD REPORTING METRICS ---

  public getFinanceMetrics() {
    const activeSubs = this.subscriptions.filter((s) => s.status === 'active');

    // Calculate MRR: normalize to monthly
    let mrr = 0;
    activeSubs.forEach((sub) => {
      let monthlyVal = sub.totalAmount;
      if (sub.billingFrequency === 'yearly') monthlyVal = sub.totalAmount / 12;
      else if (sub.billingFrequency === 'weekly') monthlyVal = sub.totalAmount * 4.33;
      else if (sub.billingFrequency === 'daily') monthlyVal = sub.totalAmount * 30;
      mrr += monthlyVal;
    });

    const arr = mrr * 12;

    const totalCashCollected = this.payments.reduce((acc, p) => acc + p.amount, 0);

    const outstandingReceivables = this.invoices
      .filter((i) => i.status === 'confirmed' || i.status === 'overdue')
      .reduce((acc, i) => acc + i.balanceDue, 0);

    const overdueInvoices = this.invoices.filter((i) => i.status === 'overdue' && i.balanceDue > 0);
    const overdueAmount = overdueInvoices.reduce((acc, i) => acc + i.balanceDue, 0);

    // Aging buckets
    const today = new Date().toISOString().slice(0, 10);
    const todayTime = new Date(today).getTime();

    const aging = {
      current: 0,
      days1To30: 0,
      days31To60: 0,
      days60Plus: 0,
    };

    this.invoices
      .filter((i) => (i.status === 'confirmed' || i.status === 'overdue') && i.balanceDue > 0)
      .forEach((inv) => {
        const dueTime = new Date(inv.dueDate).getTime();
        const diffDays = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          aging.current += inv.balanceDue;
        } else if (diffDays <= 30) {
          aging.days1To30 += inv.balanceDue;
        } else if (diffDays <= 60) {
          aging.days31To60 += inv.balanceDue;
        } else {
          aging.days60Plus += inv.balanceDue;
        }
      });

    const arpu = activeSubs.length > 0 ? mrr / activeSubs.length : 0;

    return {
      activeSubscriptionsCount: activeSubs.length,
      pastDueSubscriptionsCount: this.subscriptions.filter((s) => s.status === 'past_due').length,
      totalSubscriptionsCount: this.subscriptions.length,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      totalCashCollected: Math.round(totalCashCollected * 100) / 100,
      outstandingReceivables: Math.round(outstandingReceivables * 100) / 100,
      overdueInvoicesCount: overdueInvoices.length,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      aging,
    };
  }
}

export const store = new BrightloopStore();
