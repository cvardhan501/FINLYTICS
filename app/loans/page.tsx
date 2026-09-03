'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { InterestCalculatorModal } from '@/components/loans/InterestCalculatorModal';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Calculator,
  Plus,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  PlusCircle,
  History,
  Trash2,
  Filter,
  DollarSign,
  AlertTriangle,
  X,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '@/lib/finance/calculations';

export default function LoansPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'given' | 'borrowed' | 'people'>('given');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  const [loans, setLoans] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalGiven: 0,
    totalGivenPaid: 0,
    totalGivenRemaining: 0,
    interestToReceive: 0,
    totalBorrowed: 0,
    totalBorrowedPaid: 0,
    totalBorrowedRemaining: 0,
    interestToPay: 0,
  });
  const [loading, setLoading] = useState(true);

  // Add Loan Modal
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [loanType, setLoanType] = useState<'given' | 'borrowed'>('given');
  const [personName, setPersonName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [interestType, setInterestType] = useState<'simple' | 'compound'>('simple');
  const [dueDate, setDueDate] = useState('');
  const [loanNotes, setLoanNotes] = useState('');

  // Payment Confirmation Modal
  const [paymentLoan, setPaymentLoan] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Loan Detail Modal
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const fetchLoansData = async () => {
    setLoading(true);
    try {
      const [lRes, pRes] = await Promise.all([fetch('/api/loans'), fetch('/api/people')]);
      const lData = await lRes.json();
      const pData = await pRes.json();

      setLoans(lData.loans || []);
      setPeople(pData.people || []);
      if (lData.summary) setSummary(lData.summary);

      // If detail modal is open, refresh selectedLoan reference
      if (selectedLoan) {
        const updated = (lData.loans || []).find(
          (l: any) => (l.id || l._id) === (selectedLoan.id || selectedLoan._id)
        );
        if (updated) setSelectedLoan(updated);
      }
    } catch (e) {
      console.error('Error fetching loans:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoansData();
  }, []);

  const openAddModalFor = (type: 'given' | 'borrowed') => {
    setLoanType(type);
    setPersonName('');
    setPrincipal('');
    setInterestRate('0');
    setDueDate('');
    setLoanNotes('');
    setIsAddLoanModalOpen(true);
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !principal) return;

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName,
          type: loanType,
          principal: parseFloat(principal),
          interestRate: parseFloat(interestRate) || 0,
          interestType,
          startDate: new Date().toISOString(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 86400000 * 30).toISOString(),
          notes: loanNotes,
        }),
      });

      if (res.ok) {
        setIsAddLoanModalOpen(false);
        fetchLoansData();
      }
    } catch (e) {
      console.error('Error creating loan:', e);
    }
  };

  const openPaymentModal = (loan: any) => {
    setPaymentLoan(loan);
    setPaymentAmount('');
    setPaymentMethod('UPI');
    setPaymentNote('');
    setPaymentError('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentLoan || !paymentAmount) return;

    const amt = parseFloat(paymentAmount);
    const remaining = paymentLoan.remainingAmount || paymentLoan.principal;

    if (amt > remaining + 0.01) {
      setPaymentError(`Amount cannot exceed the remaining balance of ${formatCurrency(remaining, user?.currency)}.`);
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError('');

    try {
      const res = await fetch(`/api/loans/${paymentLoan.id || paymentLoan._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          paymentDate: new Date().toISOString(),
          paymentMethod,
          notes: paymentNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || 'Failed to record payment');
        setIsSubmittingPayment(false);
        return;
      }

      setPaymentLoan(null);
      fetchLoansData();
    } catch (e: any) {
      setPaymentError(e.message || 'Payment processing failed');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Delete this loan? This will remove the loan and its complete payment history.')) return;
    try {
      await fetch(`/api/loans/${loanId}`, { method: 'DELETE' });
      setSelectedLoan(null);
      fetchLoansData();
    } catch (e) {
      console.error('Delete loan error:', e);
    }
  };

  // Filter loans by type and status
  const currentTabLoans = loans.filter((l) => l.type === activeTab);
  const filteredLoans = currentTabLoans.filter((l) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return l.status === 'active';
    if (statusFilter === 'partially_paid') return l.status === 'partially_paid';
    if (statusFilter === 'overdue') return l.status === 'overdue';
    if (statusFilter === 'paid') return l.status === 'paid';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-20 md:pb-6">
      <Header userName={user?.name} currency={user?.currency || 'INR'} />

      <div className="max-w-6xl mx-auto flex">
        <DesktopSidebar onOpenAddModal={() => setIsAddTransactionModalOpen(true)} />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Loans & Interest
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Track Money Given vs. Money Borrowed with full payment history
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCalculatorOpen(true)}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Calculator className="w-4 h-4 text-[#187A4E]" />
                <span className="hidden sm:inline">Interest Calculator</span>
              </button>

              <button
                onClick={() => openAddModalFor('given')}
                className="px-3 py-2 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Money Given</span>
              </button>

              <button
                onClick={() => openAddModalFor('borrowed')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Money Borrowed</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('given')}
              className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'given'
                  ? 'border-[#187A4E] text-[#187A4E] dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Money Given</span>
            </button>

            <button
              onClick={() => setActiveTab('borrowed')}
              className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'borrowed'
                  ? 'border-[#187A4E] text-[#187A4E] dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Money Borrowed</span>
            </button>

            <button
              onClick={() => setActiveTab('people')}
              className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'people'
                  ? 'border-[#187A4E] text-[#187A4E] dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>People Ledger ({people.length})</span>
            </button>
          </div>

          {/* Money Given Summary Cards */}
          {activeTab === 'given' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Total Given
                </span>
                <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(summary.totalGiven || 0, user?.currency)}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Total Received
                </span>
                <p className="text-lg font-extrabold text-[#187A4E] dark:text-emerald-400 mt-1">
                  {formatCurrency(summary.totalGivenPaid || 0, user?.currency)}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Remaining Outstanding
                </span>
                <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {formatCurrency(summary.totalGivenRemaining || 0, user?.currency)}
                </p>
              </div>
            </div>
          )}

          {/* Money Borrowed Summary Cards */}
          {activeTab === 'borrowed' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Total Borrowed
                </span>
                <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(summary.totalBorrowed || 0, user?.currency)}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Total Paid
                </span>
                <p className="text-lg font-extrabold text-[#187A4E] dark:text-emerald-400 mt-1">
                  {formatCurrency(summary.totalBorrowedPaid || 0, user?.currency)}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Remaining Outstanding
                </span>
                <p className="text-lg font-extrabold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(summary.totalBorrowedRemaining || 0, user?.currency)}
                </p>
              </div>
            </div>
          )}

          {/* Filter Bar for Loans */}
          {activeTab !== 'people' && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'partially_paid', label: 'Partially Paid' },
                { key: 'overdue', label: 'Overdue' },
                { key: 'paid', label: 'Fully Settled' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                    statusFilter === f.key
                      ? 'bg-[#187A4E] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab 1 & 2: Loans List */}
          {activeTab !== 'people' && (
            <div className="space-y-3">
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading loans...</div>
              ) : filteredLoans.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-3 shadow-xs">
                  <HandCoins className="w-8 h-8 text-[#187A4E] mx-auto" />
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                    No active loans found
                  </p>
                  <p className="text-xs text-gray-500">
                    Keep track of money you give to or borrow from people.
                  </p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={() => openAddModalFor('given')}
                      className="px-3.5 py-2 bg-[#187A4E] text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      + Money Given
                    </button>
                    <button
                      onClick={() => openAddModalFor('borrowed')}
                      className="px-3.5 py-2 bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      + Money Borrowed
                    </button>
                  </div>
                </div>
              ) : (
                filteredLoans.map((loan) => {
                  const isGiven = loan.type === 'given';
                  const isSettled = loan.status === 'paid';
                  const isOverdue = loan.status === 'overdue';
                  const isPartiallyPaid = loan.status === 'partially_paid';

                  return (
                    <div
                      key={loan.id || loan._id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/50 transition-colors"
                    >
                      <div
                        onClick={() => setSelectedLoan(loan)}
                        className="space-y-1.5 cursor-pointer flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                            {loan.personName}
                          </h4>

                          {isSettled ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Fully Settled
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          ) : isPartiallyPaid ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Partially Paid
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                          <span>
                            {isGiven ? 'Given' : 'Borrowed'}:{' '}
                            <strong className="text-gray-900 dark:text-white">
                              {formatCurrency(loan.principal, user?.currency)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            {isGiven ? 'Received' : 'Paid'}:{' '}
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(loan.totalPaid || 0, user?.currency)}
                            </strong>
                          </span>
                        </div>

                        {loan.notes && (
                          <p className="text-[11px] text-gray-400 italic">"{loan.notes}"</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold">
                            Remaining
                          </p>
                          <p
                            className={`text-base font-extrabold ${
                              isSettled
                                ? 'text-gray-400 line-through'
                                : isGiven
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {formatCurrency(loan.remainingAmount || 0, user?.currency)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isSettled && (
                            <button
                              onClick={() => openPaymentModal(loan)}
                              className="px-3 py-1.5 bg-[#187A4E] hover:bg-[#13633F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{isGiven ? 'Receive' : 'Pay'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedLoan(loan)}
                            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                            title="View History & Details"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: People Ledger */}
          {activeTab === 'people' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800 shadow-xs">
              {people.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-xs text-gray-500">
                  No contacts found in your debt ledger yet.
                </div>
              ) : (
                people.map((p) => (
                  <div key={p.name} className="p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#187A4E] dark:bg-emerald-950 dark:text-emerald-300 font-extrabold flex items-center justify-center text-sm shadow-xs">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          {p.givenCount || 0} Given • {p.borrowedCount || 0} Borrowed
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        Net Outstanding: {formatCurrency(p.netBalance || 0, user?.currency)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <MobileNav onOpenAddModal={() => setIsAddTransactionModalOpen(true)} />
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
      />
      <InterestCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* New Loan Modal */}
      {isAddLoanModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                {loanType === 'given' ? 'Record Money Given' : 'Record Money Borrowed'}
              </h3>
              <button
                onClick={() => setIsAddLoanModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ravi or Arun"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Type</label>
                  <select
                    value={loanType}
                    onChange={(e: any) => setLoanType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                  >
                    <option value="given">Money Given (Receivable)</option>
                    <option value="borrowed">Money Borrowed (Payable)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Amount ({user?.currency || 'INR'})
                  </label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Interest Type</label>
                  <select
                    value={interestType}
                    onChange={(e: any) => setInterestType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                  >
                    <option value="simple">No Interest / Simple</option>
                    <option value="compound">Compound Interest</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency medical help"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLoanModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#187A4E] text-white font-bold rounded-lg shadow-xs"
                >
                  Save Loan Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive / Pay Payment Confirmation Modal */}
      {paymentLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                {paymentLoan.type === 'given'
                  ? `Receive Money from ${paymentLoan.personName}`
                  : `Pay Money to ${paymentLoan.personName}`}
              </h3>
              <button
                onClick={() => setPaymentLoan(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pre-payment confirmation preview */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl space-y-1.5 border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Outstanding:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(paymentLoan.remainingAmount || paymentLoan.principal, user?.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">New Payment:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {paymentAmount ? formatCurrency(parseFloat(paymentAmount) || 0, user?.currency) : '₹0'}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200 dark:border-slate-700">
                <span className="font-semibold text-gray-700 dark:text-slate-300">Remaining After Payment:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  {formatCurrency(
                    Math.max(
                      0,
                      (paymentLoan.remainingAmount || paymentLoan.principal) - (parseFloat(paymentAmount) || 0)
                    ),
                    user?.currency
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">
                  {paymentLoan.type === 'given' ? 'Amount Received' : 'Amount Paid'} ({user?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  placeholder="3000"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    setPaymentError('');
                  }}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Partial repayment"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border rounded-lg text-xs"
                />
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-lg font-medium">
                  {paymentError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentLoan(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 bg-[#187A4E] text-white font-bold rounded-lg shadow-xs"
                >
                  {isSubmittingPayment ? 'Saving...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Detail & Complete Payment History Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {selectedLoan.personName}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedLoan.type === 'given' ? 'Money Given (Receivable)' : 'Money Borrowed (Payable)'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteLoan(selectedLoan.id || selectedLoan._id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg"
                  title="Delete Loan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metric Summary Grid */}
            <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Principal</span>
                <span className="font-extrabold text-gray-900 dark:text-white text-xs">
                  {formatCurrency(selectedLoan.principal, user?.currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">
                  {selectedLoan.type === 'given' ? 'Received' : 'Paid'}
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                  {formatCurrency(selectedLoan.totalPaid || 0, user?.currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Outstanding</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                  {formatCurrency(selectedLoan.remainingAmount || 0, user?.currency)}
                </span>
              </div>
            </div>

            {/* Complete Payment History Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#187A4E]" />
                  <span>Complete Payment History ({selectedLoan.payments?.length || 0})</span>
                </h4>

                {selectedLoan.status !== 'paid' && (
                  <button
                    onClick={() => {
                      const l = selectedLoan;
                      setSelectedLoan(null);
                      openPaymentModal(l);
                    }}
                    className="px-2.5 py-1 bg-[#187A4E] text-white text-[11px] font-bold rounded-lg shadow-xs"
                  >
                    + Record Payment
                  </button>
                )}
              </div>

              {!selectedLoan.payments || selectedLoan.payments.length === 0 ? (
                <p className="text-gray-400 text-center py-4 italic">No payment history recorded yet.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  {selectedLoan.payments.map((p: any) => (
                    <div key={p.id || p._id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {selectedLoan.type === 'given' ? 'Received' : 'Paid'}{' '}
                          {formatCurrency(p.amount, user?.currency)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {p.paymentMethod || 'UPI'} •{' '}
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        {p.notes && (
                          <p className="text-[11px] text-gray-500 italic mt-0.5">"{p.notes}"</p>
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Recorded
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
