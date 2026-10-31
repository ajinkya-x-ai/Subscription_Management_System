import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { User, Role } from './types';
import { Header } from './components/Header';
import { Sidebar, ViewType } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { BillingDayView } from './views/BillingDayView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { InvoicesView } from './views/InvoicesView';
import { PaymentsView } from './views/PaymentsView';
import { ProductsAndPlansView } from './views/ProductsAndPlansView';
import { QuotationTemplatesView } from './views/QuotationTemplatesView';
import { DiscountsAndTaxesView } from './views/DiscountsAndTaxesView';
import { StaffManagementView } from './views/StaffManagementView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [, setTick] = useState(0);
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | null>(null);

  // Subscribe to central reactive store
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
      setCurrentUser(store.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  // When switching to customer role, default to Customer Portal
  useEffect(() => {
    if (currentUser.role === 'customer' && activeView !== 'invoices') {
      setActiveView('customer-portal');
    }
  }, [currentUser]);

  const invoices = store.getInvoices();
  const unpaidCount = invoices.filter(
    (i) => (i.status === 'confirmed' || i.status === 'overdue') && i.balanceDue > 0
  ).length;

  const billingDueCount =
    store.getBillingEligibleSubscriptions('2026-11-01').length +
    store.getRetryEligibleSubscriptions('2026-11-01').length;

  const getViewTitle = (view: ViewType): string => {
    switch (view) {
      case 'dashboard':
        return 'Finance Command & MRR Analytics';
      case 'billing-day':
        return 'Billing Day Automated Runner';
      case 'subscriptions':
        return 'Subscriptions & Quotations Pipeline';
      case 'invoices':
        return 'Invoices & Billing Statements';
      case 'payments':
        return 'Payments & Cash Reconciliation';
      case 'products-plans':
        return 'Products, Variants & Plans';
      case 'quotation-templates':
        return 'Quotation Templates Library';
      case 'discounts-taxes':
        return 'Discounts & Automatic Taxes';
      case 'staff':
        return 'Staff & Team Access Management';
      case 'customer-portal':
        return 'Customer Self-Service Portal';
    }
  };

  const handleUseTemplate = (templateId: string) => {
    setActiveView('subscriptions');
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 flex flex-col text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Bar Contract Header */}
      <Header
        currentUser={currentUser}
        activeViewTitle={getViewTitle(activeView)}
        onOpenAuthModal={(mode) => setAuthModalMode(mode)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Role-based Sidebar */}
        <Sidebar
          currentRole={currentUser.role}
          activeView={activeView}
          onSelectView={(v) => setActiveView(v)}
          unpaidCount={unpaidCount}
          billingDueCount={billingDueCount}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && (
              <DashboardView
                onNavigateToBillingDay={() => setActiveView('billing-day')}
                onNavigateToInvoices={() => setActiveView('invoices')}
                onNavigateToSubscriptions={() => setActiveView('subscriptions')}
              />
            )}

            {activeView === 'billing-day' && (
              <BillingDayView
                onNavigateToInvoices={() => setActiveView('invoices')}
                onViewInvoiceDetail={(invId) => setActiveView('invoices')}
              />
            )}

            {activeView === 'subscriptions' && (
              <SubscriptionsView
                currentRole={currentUser.role}
                onNavigateToInvoice={(invId) => setActiveView('invoices')}
              />
            )}

            {activeView === 'invoices' && (
              <InvoicesView
                currentRole={currentUser.role}
                customerOnlyEmail={
                  currentUser.role === 'customer' ? currentUser.email : undefined
                }
              />
            )}

            {activeView === 'payments' && <PaymentsView currentRole={currentUser.role} />}

            {activeView === 'products-plans' && (
              <ProductsAndPlansView currentRole={currentUser.role} />
            )}

            {activeView === 'quotation-templates' && (
              <QuotationTemplatesView
                currentRole={currentUser.role}
                onUseTemplate={handleUseTemplate}
              />
            )}

            {activeView === 'discounts-taxes' && (
              <DiscountsAndTaxesView currentRole={currentUser.role} />
            )}

            {activeView === 'staff' && <StaffManagementView currentRole={currentUser.role} />}

            {activeView === 'customer-portal' && (
              <CustomerPortalView currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>

      {/* Auth & Registration Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setActiveView(user.role === 'customer' ? 'customer-portal' : 'dashboard');
          }}
        />
      )}
    </div>
  );
}
