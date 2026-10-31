# Brightloop Software — Subscription Management & Recurring Billing System

> Unified subscription platform to manage plans, quotes, automated recurring billing batches, configurable dunning schedules, discount rules, payments, customer self-service, and real-time revenue analytics.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Vite**..

---

## 🌟 Core Features

### 1. Unified Subscriptions & Quotation Pipeline
- **Lifecycle Stages**: Progress contracts from `Draft` $\to$ `Quotation` $\to$ `Confirmed` $\to$ `Active` $\to$ `Past Due` $\to$ `Closed` (plus `Paused`).
- **Quotation Templates**: Reusable templates with preset product lines, variants, payment terms, and validity windows.
- **Product Variants**: Brand and edition price deltas (e.g. Odoo Brand connector adds +$560 to price).
- **Plan Policies**: Per-plan policies governing automatic closing on term end (`autoCloseOnEnd`), early termination allowances (`allowEarlyClose`), pause permissions (`allowPause`), and auto-renewal (`autoRenew`).

### 2. Automated Billing Day Batch Engine
- **One-Click Batch Execution**: Scans all active subscriptions due on or before a chosen billing date and generates itemized invoices automatically.
- **Idempotency Protection**: Ensures no subscription is billed twice or skipped for any billing period.
- **Automated Tax Calculation**: Regional rules (Standard VAT 20%, US Sales Tax 8.25%, GST 5%, Export 0%) calculated line by line.
- **Automated Discounts**: Volume and spend thresholds (e.g., `VOLUME10`, `ENTERPRISE500`) applied automatically without manual input.

### 3. Automated Dunning & Payment Retries (`past_due`)
- **Configurable Dunning Schedule**: Define custom multi-step retry timelines (e.g., Day 1, Day 3, Day 8, Day 14).
- **Automated Recovery**: Retries failed card payments in batch. Successful charges restore subscriptions to `Active` and settle invoice balances.
- **Exhaustion Policies**: Automatically executes `auto_pause`, `auto_close`, or `keep_past_due` when maximum retry attempts are reached.
- **Audit Logging**: Full history of retry attempts, error codes, and customer notifications.

### 4. Payments Reconciliation & Cash Ledger
- Multi-channel payment recording: Bank Wire, Corporate Credit Card, ACH Direct Debit, Stripe, and Company Check.
- Partial payment support with remaining balance tracking.
- Instant reconciliation against invoices with auto-status transitions to `Paid`.

### 5. Role-Based Access Control (RBAC) & Customer Portal
- **Admin**: Full control over products, plans, taxes, discounts, staff accounts, and financial dashboards.
- **Internal Staff**: Day-to-day subscription and quote handling, invoice dispatching, and payment reconciliation.
- **Customer Portal**: Self-service interface for customers to inspect their subscriptions, toggle add-on modules on/off, accept quote proposals, and pay invoices online.
- **Quick Persona Switcher**: Seamlessly switch between admin, staff, and customer accounts for testing.

### 6. Finance Lead Command Center
- Real-time KPIs: MRR, ARR, Cash Collected, Outstanding Receivables, and Overdue Balances.
- Receivables aging breakdown: Current (0–15d), 1–30d, 31–60d, and 60d+ overdue.
- 1-Click "Chase Overdue" dunning dispatch.
- CSV data export.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/brightloop-subscription-system.git

# Navigate to project folder
cd brightloop-subscription-system

# Install dependencies
npm install
```

### Development

```bash
# Start Vite development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build production bundle
npm run build

# Preview build locally
npm run preview
```

---

## 📁 Project Architecture

```
├── index.html                   # HTML entry point with fonts & metadata
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS plugin
├── README.md                    # Project documentation
└── src/
    ├── main.tsx                 # React application mounting
    ├── App.tsx                  # Root component with routing & reactive store subscription
    ├── index.css                # Global CSS styles & Tailwind configuration
    ├── types/
    │   └── index.ts             # Domain models (Subscriptions, Invoices, Plans, Dunning)
    ├── data/
    │   └── initialData.ts       # Realistic seed data for Brightloop Software
    ├── services/
    │   └── store.ts             # Reactive local store, billing runner & dunning engine
    ├── components/
    │   ├── Header.tsx           # Top-bar contract & persona switcher
    │   ├── Sidebar.tsx          # Role-based workspace navigation
    │   └── AuthModal.tsx        # Authentication modal with password policy checks
    └── views/
        ├── DashboardView.tsx        # Finance lead end-of-month reporting & aging
        ├── BillingDayView.tsx       # Automated recurring invoicing & dunning retry engine
        ├── SubscriptionsView.tsx    # Subscriptions & quotation pipeline
        ├── InvoicesView.tsx         # Printable invoices & payment modal
        ├── PaymentsView.tsx         # Cash reconciliation ledger
        ├── ProductsAndPlansView.tsx # Products catalog, variants & plan policies
        ├── QuotationTemplatesView.tsx# Reusable sales quotation templates
        ├── DiscountsAndTaxesView.tsx# Admin-only discount rules & tax brackets
        ├── StaffManagementView.tsx  # Admin-only team member management
        └── CustomerPortalView.tsx   # Customer self-service portal
```

---

## 🛡️ License

MIT License. Copyright (c) 2026 Brightloop Software.
