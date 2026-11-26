import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import type {
  BalanceActionType,
  BalanceLog,
  FinanceStoreState,
  MainNavKey,
  TimeRangeKey,
  Transaction,
  TransactionType,
} from './types/finance';
import {
  TIME_RANGE_OPTIONS,
  computeBaseBalanceForTarget,
  computeCurrentBalance,
  filterTransactionsByRange,
  formatRupiah,
  getTodayISODate,
  summarizeTransactions,
} from './utils/finance';
import { createInitialFinanceState } from './data/seedData';
import { exportReportToExcel, exportReportToPDF } from './utils/exportReport';
import {
  getSavedAccountMeta,
  googleSignIn,
  initAuth,
  logoutGoogle,
  type SavedAccountMeta,
} from './services/googleAuth';
import {
  hasMeaningfulFinanceData,
  resolveUserInitialFinanceState,
  saveUserLocalFinanceState,
} from './services/userStorage';
import {
  loadUserFinanceFromSheet,
  sanitizeBrandName,
  saveUserFinanceToSheet,
} from './services/sheetStorage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HeroOverview } from './components/HeroOverview';
import { CashflowCharts } from './components/CashflowCharts';
import { LedgerSheet } from './components/LedgerSheet';
import { AccountPanel } from './components/AccountPanel';
import { PersonalizationPanel } from './components/PersonalizationPanel';
import { BalanceModal } from './components/BalanceModal';
import { TransactionModal } from './components/TransactionModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { MobileBottomNav } from './components/MobileBottomNav';

const SIDEBAR_COLLAPSED_KEY = 'kasbuku_sidebar_collapsed_v1';

function loadInitialStoreForSavedSession(): FinanceStoreState {
  const saved = getSavedAccountMeta();
  if (saved?.uid) {
    return resolveUserInitialFinanceState(saved.uid);
  }
  return createInitialFinanceState();
}

function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  const [store, setStore] = useState<FinanceStoreState>(
    loadInitialStoreForSavedSession
  );
  const storeRef = useRef<FinanceStoreState>(store);
  storeRef.current = store;

  const [activeMenu, setActiveMenu] = useState<MainNavKey>('grafik');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    loadSidebarCollapsed
  );
  const [activeRange, setActiveRange] = useState<TimeRangeKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth state (persisted via browserLocalPersistence + saved profile metadata)
  const [user, setUser] = useState<User | null>(null);
  const [savedAccount, setSavedAccount] = useState<SavedAccountMeta | null>(() =>
    getSavedAccountMeta()
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Modals
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceModalMode, setBalanceModalMode] =
    useState<BalanceActionType>('add');
  const [editingBalanceLog, setEditingBalanceLog] =
    useState<BalanceLog | null>(null);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(
    null
  );

  // Transient notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sheetWarnedRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const activeUid = user?.uid || savedAccount?.uid || '';
  const activeEmail = user?.email || savedAccount?.email || '';
  const isAuthenticated = Boolean(user || savedAccount);
  const isLocked = !isAuthenticated;

  // Persist per-user local cache (never deletes other users' storage)
  useEffect(() => {
    if (!isAuthenticated || !activeUid) return;
    saveUserLocalFinanceState(activeUid, store);
  }, [store, isAuthenticated, activeUid]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        sidebarCollapsed ? 'true' : 'false'
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [sidebarCollapsed]);

  const activeProfile = useMemo(() => {
    if (user) {
      return {
        email: user.email || savedAccount?.email || '',
        displayName: user.displayName || savedAccount?.displayName || '',
        photoURL: user.photoURL || savedAccount?.photoURL || '',
      };
    }
    if (savedAccount) {
      return {
        email: savedAccount.email,
        displayName: savedAccount.displayName,
        photoURL: savedAccount.photoURL,
      };
    }
    return null;
  }, [user, savedAccount]);

  // Enforce Rp0 & empty data whenever not logged in
  const effectiveStore = useMemo<FinanceStoreState>(() => {
    if (!isAuthenticated) {
      return createInitialFinanceState();
    }
    return store;
  }, [isAuthenticated, store]);

  // Sync browser page title with personalized brandName
  const displayBrand = effectiveStore.brandName?.trim() || 'KasBuku';
  useEffect(() => {
    document.title = `${displayBrand} — Pembukuan Keuangan & Manajemen Saldo`;
  }, [displayBrand]);

  // Auth listener (restores persistent user automatically on reload)
  useEffect(() => {
    const unsubscribe = initAuth((authedUser) => {
      setUser(authedUser);
      setSavedAccount(getSavedAccountMeta());
      if (authedUser) {
        setStore(resolveUserInitialFinanceState(authedUser.uid));
      } else {
        setStore(createInitialFinanceState());
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user's saved financial data from Google Apps Script Sheet on login/reload
  useEffect(() => {
    if (!isAuthenticated || !activeUid) return;
    let cancelled = false;
    const localSeed = resolveUserInitialFinanceState(activeUid);

    void (async () => {
      const res = await loadUserFinanceFromSheet(activeUid, activeEmail);
      if (cancelled) return;

      if (res.status === 'found') {
        if (
          hasMeaningfulFinanceData(res.data) ||
          !hasMeaningfulFinanceData(localSeed)
        ) {
          setStore(res.data);
          saveUserLocalFinanceState(activeUid, res.data);
        } else {
          // Local has existing data while Sheet row is empty -> sync up to Sheet
          void saveUserFinanceToSheet(activeUid, activeEmail, localSeed);
        }
      } else if (res.status === 'not_found') {
        void saveUserFinanceToSheet(activeUid, activeEmail, localSeed);
      } else if (res.reason === 'script_not_ready' && !sheetWarnedRef.current) {
        sheetWarnedRef.current = true;
        setAuthError(
          'Apps Script URL belum memiliki fungsi doGet/doPost yang di-deploy. Data tetap tersimpan sementara di perangkat ini.'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeUid, activeEmail]);

  const syncNextStateToSheet = (nextState: FinanceStoreState) => {
    if (!activeUid) return;
    saveUserLocalFinanceState(activeUid, nextState);
    void saveUserFinanceToSheet(activeUid, activeEmail, nextState).then(
      (res) => {
        if (
          res.status === 'error' &&
          res.reason === 'script_not_ready' &&
          !sheetWarnedRef.current
        ) {
          sheetWarnedRef.current = true;
          setAuthError(
            'Apps Script URL belum memiliki fungsi doGet/doPost yang di-deploy. Data tetap tersimpan sementara di perangkat ini.'
          );
        }
      }
    );
  };

  const rangeLabel =
    TIME_RANGE_OPTIONS.find((opt) => opt.key === activeRange)?.label ?? 'All';

  const filteredTransactions = useMemo(
    () => filterTransactionsByRange(effectiveStore.transactions, activeRange),
    [effectiveStore.transactions, activeRange]
  );

  const summary = useMemo(
    () => summarizeTransactions(filteredTransactions),
    [filteredTransactions]
  );

  const currentBalance = useMemo(() => {
    if (!isAuthenticated) return 0;
    return computeCurrentBalance(
      effectiveStore.baseBalance,
      effectiveStore.balanceLogs,
      effectiveStore.transactions
    );
  }, [
    isAuthenticated,
    effectiveStore.baseBalance,
    effectiveStore.balanceLogs,
    effectiveStore.transactions,
  ]);

  const handleSelectMenu = (menu: MainNavKey) => {
    setActiveMenu(menu);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const requireAuthOrRedirect = (): boolean => {
    if (isAuthenticated) return true;
    setAuthError(
      'Silakan masuk dengan Akun Google terlebih dahulu untuk menggunakan seluruh fitur.'
    );
    handleSelectMenu('akun');
    showToast('Masuk dengan Akun Google untuk membuka semua fitur.');
    return false;
  };

  // Handlers: Auth
  const handleGoogleLogin = async (selectAccount = false) => {
    setIsLoggingIn(true);
    setAuthError(null);
    sheetWarnedRef.current = false;
    try {
      const signedInUser = await googleSignIn({ selectAccount });
      if (signedInUser) {
        setUser(signedInUser);
        setSavedAccount(getSavedAccountMeta());
        setStore(resolveUserInitialFinanceState(signedInUser.uid));
        showToast('Akun Google berhasil masuk. Data akun Anda dimuat.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal masuk dengan Google. Silakan coba lagi.';
      setAuthError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    // Only reset active session UI state; NEVER delete per-user, Sheet, or other users' storage
    setUser(null);
    setSavedAccount(null);
    setStore(createInitialFinanceState());
    setActiveRange('all');
    setSearchQuery('');
    setBalanceModalOpen(false);
    setTxModalOpen(false);
    setPendingDeleteTx(null);
    setAuthError(null);
    showToast(
      'Sesi akun keluar & tampilan direset ke Rp0. Data akun Anda tetap tersimpan.'
    );
  };

  // Handlers: Transactions
  const handleSaveTransaction = (payload: {
    id?: string;
    date: string;
    description: string;
    category: string;
    type: TransactionType;
    amount: number;
  }) => {
    if (!requireAuthOrRedirect()) return;
    const nowIso = new Date().toISOString();
    const prev = storeRef.current;

    if (payload.id) {
      const targetId = payload.id;
      const nextState: FinanceStoreState = {
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === targetId
            ? {
                ...tx,
                date: payload.date,
                description: payload.description,
                category: payload.category,
                type: payload.type,
                amount: payload.amount,
                updatedAt: nowIso,
              }
            : tx
        ),
      };
      setStore(nextState);
      syncNextStateToSheet(nextState);
      showToast(`Baris "${payload.description}" berhasil diperbarui.`);
    } else {
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: payload.date,
        description: payload.description,
        category: payload.category,
        type: payload.type,
        amount: payload.amount,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const nextState: FinanceStoreState = {
        ...prev,
        transactions: [newTx, ...prev.transactions],
      };
      setStore(nextState);
      syncNextStateToSheet(nextState);
      showToast(
        `Transaksi "${payload.description}" (${formatRupiah(
          payload.amount
        )}) ditambahkan.`
      );
    }
  };

  const handleConfirmDeleteTransaction = () => {
    if (!requireAuthOrRedirect() || !pendingDeleteTx) return;
    const deletedId = pendingDeleteTx.id;
    const deletedName = pendingDeleteTx.description;
    const prev = storeRef.current;

    const nextState: FinanceStoreState = {
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== deletedId),
    };
    setStore(nextState);
    setPendingDeleteTx(null);
    syncNextStateToSheet(nextState);
    showToast(`Transaksi "${deletedName}" dihapus.`);
  };

  // Handlers: Balance (Set Saldo, Add Saldo + Note, Edit Saldo)
  const handleOpenBalanceModal = (mode: BalanceActionType) => {
    if (!requireAuthOrRedirect()) return;
    setEditingBalanceLog(null);
    setBalanceModalMode(mode);
    setBalanceModalOpen(true);
  };

  const handleEditBalanceLog = (log: BalanceLog) => {
    if (!requireAuthOrRedirect()) return;
    setEditingBalanceLog(log);
    setBalanceModalMode(log.action);
    setBalanceModalOpen(true);
  };

  const handleSubmitBalanceAction = (payload: {
    mode: BalanceActionType;
    amount: number;
    note: string;
    editingLogId?: string;
  }) => {
    if (!requireAuthOrRedirect()) return;
    const nowIso = new Date().toISOString();
    const today = getTodayISODate();
    const prev = storeRef.current;
    const prevBal = computeCurrentBalance(
      prev.baseBalance,
      prev.balanceLogs,
      prev.transactions
    );

    let nextState: FinanceStoreState = prev;

    if (payload.editingLogId) {
      const targetLog = prev.balanceLogs.find(
        (l) => l.id === payload.editingLogId
      );
      if (!targetLog) return;

      if (targetLog.action === 'add') {
        const resultingBalance = targetLog.previousBalance + payload.amount;
        const updatedLogs = prev.balanceLogs.map((l) =>
          l.id === targetLog.id
            ? {
                ...l,
                amount: payload.amount,
                note: payload.note,
                resultingBalance,
              }
            : l
        );
        nextState = { ...prev, balanceLogs: updatedLogs };
      } else {
        const updatedLogs = prev.balanceLogs.map((l) =>
          l.id === targetLog.id
            ? {
                ...l,
                amount: payload.amount,
                note: payload.note,
                resultingBalance: payload.amount,
              }
            : l
        );
        const newBase = computeBaseBalanceForTarget(
          payload.amount,
          updatedLogs,
          prev.transactions
        );
        nextState = {
          ...prev,
          baseBalance: newBase,
          balanceLogs: updatedLogs,
        };
      }
    } else if (payload.mode === 'add') {
      const newLog: BalanceLog = {
        id: `bal-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        action: 'add',
        amount: payload.amount,
        previousBalance: prevBal,
        resultingBalance: prevBal + payload.amount,
        note: payload.note,
        date: today,
        createdAt: nowIso,
      };
      nextState = {
        ...prev,
        balanceLogs: [newLog, ...prev.balanceLogs],
      };
    } else {
      const newBase = computeBaseBalanceForTarget(
        payload.amount,
        prev.balanceLogs,
        prev.transactions
      );
      const newLog: BalanceLog = {
        id: `bal-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        action: payload.mode,
        amount: payload.amount,
        previousBalance: prevBal,
        resultingBalance: payload.amount,
        note: payload.note,
        date: today,
        createdAt: nowIso,
      };
      nextState = {
        ...prev,
        baseBalance: newBase,
        balanceLogs: [newLog, ...prev.balanceLogs],
      };
    }

    setStore(nextState);
    syncNextStateToSheet(nextState);

    const label =
      payload.mode === 'add'
        ? `Saldo ditambah ${formatRupiah(payload.amount)}`
        : payload.mode === 'set'
          ? `Saldo ditetapkan menjadi ${formatRupiah(payload.amount)}`
          : `Saldo diperbarui menjadi ${formatRupiah(payload.amount)}`;
    showToast(label);
  };

  const handleUpdateBrandName = (newBrandName: string) => {
    if (!requireAuthOrRedirect()) return;
    const cleaned = sanitizeBrandName(newBrandName);
    const prev = storeRef.current;

    const nextState: FinanceStoreState = {
      ...prev,
      brandName: cleaned,
    };
    setStore(nextState);
    syncNextStateToSheet(nextState);
    showToast(`Nama aplikasi diperbarui menjadi "${cleaned}".`);
  };

  // Handlers: Exports
  const handleExportExcel = () => {
    if (!requireAuthOrRedirect()) return;
    exportReportToExcel(filteredTransactions, effectiveStore.balanceLogs, {
      brandName: displayBrand,
      totalExpense: summary.totalExpense,
      totalIncome: summary.totalIncome,
      netCashflow: summary.netCashflow,
      currentBalance,
      rangeLabel,
    });
    showToast(`Laporan Excel (${rangeLabel}) berhasil diunduh.`);
  };

  const handleExportPDF = () => {
    if (!requireAuthOrRedirect()) return;
    exportReportToPDF(filteredTransactions, {
      brandName: displayBrand,
      totalExpense: summary.totalExpense,
      totalIncome: summary.totalIncome,
      netCashflow: summary.netCashflow,
      currentBalance,
      rangeLabel,
    });
    showToast(`Laporan PDF (${rangeLabel}) berhasil diunduh.`);
  };

  return (
    <div className="min-h-screen bg-[#0D0303] text-[#EFF8FF] flex flex-col md:flex-row">
      {/* Tab Kiri (Desktop collapsible sidebar) */}
      <Sidebar
        brandName={displayBrand}
        activeMenu={activeMenu}
        collapsed={sidebarCollapsed}
        isAuthenticated={isAuthenticated}
        profile={activeProfile}
        onSelectMenu={handleSelectMenu}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Tab Kanan (Main Content Workspace + Mobile Chrome) */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <TopBar
          brandName={displayBrand}
          profile={activeProfile}
          isLoggingIn={isLoggingIn}
          onGoogleLogin={() => handleGoogleLogin(false)}
          onOpenGrafik={() => handleSelectMenu('grafik')}
          onOpenAccount={() => handleSelectMenu('akun')}
        />

        <main className="flex-1">
          {activeMenu === 'grafik' && (
            <>
              <HeroOverview
                currentBalance={currentBalance}
                totalExpense={summary.totalExpense}
                totalIncome={summary.totalIncome}
                netCashflow={summary.netCashflow}
                transactionCount={summary.count}
                activeRange={activeRange}
                rangeLabel={rangeLabel}
                isLocked={isLocked}
                onRangeChange={(range) => {
                  if (requireAuthOrRedirect()) setActiveRange(range);
                }}
                onOpenBalanceModal={handleOpenBalanceModal}
                onOpenNewTransaction={() => {
                  if (!requireAuthOrRedirect()) return;
                  setEditingTransaction(null);
                  setTxModalOpen(true);
                }}
              />

              <CashflowCharts
                transactions={filteredTransactions}
                range={activeRange}
                rangeLabel={rangeLabel}
              />
            </>
          )}

          {activeMenu === 'tabel' && (
            <LedgerSheet
              transactions={filteredTransactions}
              balanceLogs={effectiveStore.balanceLogs}
              activeRange={activeRange}
              rangeLabel={rangeLabel}
              searchQuery={searchQuery}
              totalExpense={summary.totalExpense}
              totalIncome={summary.totalIncome}
              netCashflow={summary.netCashflow}
              currentBalance={currentBalance}
              isLocked={isLocked}
              onRangeChange={(range) => {
                if (requireAuthOrRedirect()) setActiveRange(range);
              }}
              onSearchChange={(q) => {
                if (requireAuthOrRedirect()) setSearchQuery(q);
              }}
              onAddQuickTransaction={handleSaveTransaction}
              onEditTransaction={(tx) => {
                if (!requireAuthOrRedirect()) return;
                setEditingTransaction(tx);
                setTxModalOpen(true);
              }}
              onRequestDeleteTransaction={(tx) => {
                if (!requireAuthOrRedirect()) return;
                setPendingDeleteTx(tx);
              }}
              onEditBalanceLog={handleEditBalanceLog}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onOpenAccount={() => handleSelectMenu('akun')}
            />
          )}

          {activeMenu === 'akun' && (
            <AccountPanel
              profile={activeProfile}
              isLoggingIn={isLoggingIn}
              authError={authError}
              onGoogleLogin={() => handleGoogleLogin(false)}
              onSwitchAccount={() => handleGoogleLogin(true)}
              onGoogleLogout={handleGoogleLogout}
            />
          )}

          {activeMenu === 'personalisasi' && (
            <PersonalizationPanel
              brandName={displayBrand}
              isLocked={isLocked}
              onUpdateBrandName={handleUpdateBrandName}
            />
          )}
        </main>

        <footer className="border-t border-[#EFF8FF]/[0.08] py-6 pb-20 md:pb-6 px-4 sm:px-8 text-center text-xs text-[#EFF8FF]/45">
          {displayBrand} — Pembukuan Pengeluaran, Pemasukan, Grafik & Manajemen Saldo
        </footer>
      </div>

      <MobileBottomNav
        activeMenu={activeMenu}
        onSelectMenu={handleSelectMenu}
      />

      {/* Modals */}
      <BalanceModal
        open={!isLocked && balanceModalOpen}
        initialMode={balanceModalMode}
        currentBalance={currentBalance}
        editingLog={editingBalanceLog}
        onClose={() => {
          setBalanceModalOpen(false);
          setEditingBalanceLog(null);
        }}
        onSubmitAction={handleSubmitBalanceAction}
      />

      <TransactionModal
        open={!isLocked && txModalOpen}
        editingTransaction={editingTransaction}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
      />

      <ConfirmDialog
        open={!isLocked && Boolean(pendingDeleteTx)}
        title="Hapus Transaksi?"
        description={
          pendingDeleteTx
            ? `Apakah Anda yakin ingin menghapus "${pendingDeleteTx.description}" (${formatRupiah(
                pendingDeleteTx.amount
              )})?`
            : ''
        }
        confirmLabel="Hapus Baris"
        tone="danger"
        onConfirm={handleConfirmDeleteTransaction}
        onCancel={() => setPendingDeleteTx(null)}
      />

      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-18 md:bottom-5 left-4 right-4 sm:left-auto sm:right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#150A0B] border border-[#BBEF1F]/45 px-4 py-3 text-xs font-semibold text-[#EFF8FF] shadow-2xl"
          >
            <CheckCircle2
              className="w-4 h-4 text-[#BBEF1F] shrink-0"
              aria-hidden="true"
            />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
