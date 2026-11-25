import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import type {
  BalanceActionType,
  BalanceLog,
  FinanceStoreState,
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
  ensureSheetsAccessToken,
  getAccessToken,
  getSavedAccountMeta,
  googleSignIn,
  initAuth,
  logoutGoogle,
  markSheetsConsentRevoked,
  type SavedAccountMeta,
} from './services/googleAuth';
import {
  InsufficientScopeError,
  createFinanceSpreadsheet,
  fetchSpreadsheetMeta,
  readTransactionsFromSheet,
  writeTransactionsToSheet,
} from './services/googleSheets';
import { TopBar } from './components/TopBar';
import { HeroOverview } from './components/HeroOverview';
import { CashflowCharts } from './components/CashflowCharts';
import { LedgerSheet } from './components/LedgerSheet';
import { LainnyaSection, type LainnyaTabKey } from './components/LainnyaSection';
import { BalanceModal } from './components/BalanceModal';
import { TransactionModal } from './components/TransactionModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { MobileBottomNav } from './components/MobileBottomNav';

const STORAGE_KEY = 'kasbuku_finance_state_v2';

function loadInitialState(): FinanceStoreState {
  try {
    localStorage.removeItem('kasbuku_finance_state_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FinanceStoreState>;
      if (
        typeof parsed.baseBalance === 'number' &&
        Array.isArray(parsed.transactions) &&
        Array.isArray(parsed.balanceLogs)
      ) {
        return {
          brandName:
            typeof parsed.brandName === 'string' && parsed.brandName.trim()
              ? parsed.brandName.trim()
              : 'KasBuku',
          baseBalance: parsed.baseBalance,
          transactions: parsed.transactions,
          balanceLogs: parsed.balanceLogs,
          spreadsheetId: parsed.spreadsheetId ?? '',
          spreadsheetTitle: parsed.spreadsheetTitle ?? '',
          sheetTabName: parsed.sheetTabName ?? 'Transaksi',
          lastSyncedAt: parsed.lastSyncedAt ?? null,
        };
      }
    }
  } catch {
    // Fallback to clean empty state
  }
  return createInitialFinanceState();
}

export default function App() {
  const [store, setStore] = useState<FinanceStoreState>(loadInitialState);
  const [activeRange, setActiveRange] = useState<TimeRangeKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lainnyaTab, setLainnyaTab] = useState<LainnyaTabKey>('sheets');

  // Auth & Google Sheets state
  const [user, setUser] = useState<User | null>(null);
  const [savedAccount, setSavedAccount] = useState<SavedAccountMeta | null>(() =>
    getSavedAccountMeta()
  );
  const [hasToken, setHasToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [availableTabs, setAvailableTabs] = useState<string[]>([
    'Transaksi',
    'RingkasanSaldo',
  ]);
  const [sheetsBusy, setSheetsBusy] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState<string | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

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
  const [confirmSheetPushOpen, setConfirmSheetPushOpen] = useState(false);

  // Transient notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Persist local state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore storage quota issues
    }
  }, [store]);

  // Sync browser page title with personalized brandName
  const displayBrand = store.brandName?.trim() || 'KasBuku';
  useEffect(() => {
    document.title = `${displayBrand} — Pembukuan Keuangan & Google Sheets`;
  }, [displayBrand]);

  // Firebase Auth listener (restores persistent user automatically on reload)
  useEffect(() => {
    const unsubscribe = initAuth((authedUser, token) => {
      setUser(authedUser);
      setHasToken(Boolean(token));
      setSavedAccount(getSavedAccountMeta());
    });
    return () => unsubscribe();
  }, []);

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

  const rangeLabel =
    TIME_RANGE_OPTIONS.find((opt) => opt.key === activeRange)?.label ?? 'All';

  const filteredTransactions = useMemo(
    () => filterTransactionsByRange(store.transactions, activeRange),
    [store.transactions, activeRange]
  );

  const summary = useMemo(
    () => summarizeTransactions(filteredTransactions),
    [filteredTransactions]
  );

  const currentBalance = useMemo(
    () =>
      computeCurrentBalance(
        store.baseBalance,
        store.balanceLogs,
        store.transactions
      ),
    [store.baseBalance, store.balanceLogs, store.transactions]
  );

  // Handlers: Auth
  const handleGoogleLogin = async (
    mode: 'auto' | 'resume' | 'consent' | 'select_account' = 'auto'
  ) => {
    setIsLoggingIn(true);
    setSheetsError(null);
    setSheetsStatus(null);
    try {
      const res = await googleSignIn({ mode });
      if (res) {
        setUser(res.user);
        setSavedAccount(getSavedAccountMeta());
        if (!res.hasSheetsAccess) {
          setHasToken(false);
          setSheetsError(
            'Izin Google Sheets belum dicentang pada layar persetujuan Google. Klik "Berikan Izin Google Sheets" lalu centang akses Google Sheets.'
          );
          return;
        }
        setHasToken(true);
        showToast('Akun Google terhubung dan tersimpan.');
      }
    } catch (err: any) {
      setSheetsError(
        err?.message || 'Gagal masuk dengan Google. Silakan coba lagi.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage restrictions
    }
    setUser(null);
    setSavedAccount(null);
    setHasToken(false);
    setStore(createInitialFinanceState());
    setActiveRange('all');
    setSearchQuery('');
    setAvailableTabs(['Transaksi', 'RingkasanSaldo']);
    setSheetsStatus(null);
    setSheetsError(null);
    showToast('Sesi akun keluar & seluruh data pembukuan direset ke Rp0.');
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
    const nowIso = new Date().toISOString();

    if (payload.id) {
      setStore((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === payload.id
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
      }));
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
      setStore((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
      showToast(
        `Transaksi "${payload.description}" (${formatRupiah(
          payload.amount
        )}) ditambahkan.`
      );
    }
  };

  const handleConfirmDeleteTransaction = () => {
    if (!pendingDeleteTx) return;
    const deletedName = pendingDeleteTx.description;
    setStore((prev) => ({
      ...prev,
      transactions: prev.transactions.filter(
        (tx) => tx.id !== pendingDeleteTx.id
      ),
    }));
    setPendingDeleteTx(null);
    showToast(`Transaksi "${deletedName}" dihapus.`);
  };

  // Handlers: Balance (Set Saldo, Add Saldo + Note, Edit Saldo)
  const handleOpenBalanceModal = (mode: BalanceActionType) => {
    setEditingBalanceLog(null);
    setBalanceModalMode(mode);
    setBalanceModalOpen(true);
  };

  const handleEditBalanceLog = (log: BalanceLog) => {
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
    const nowIso = new Date().toISOString();
    const today = getTodayISODate();

    setStore((prev) => {
      const prevBal = computeCurrentBalance(
        prev.baseBalance,
        prev.balanceLogs,
        prev.transactions
      );

      if (payload.editingLogId) {
        const targetLog = prev.balanceLogs.find(
          (l) => l.id === payload.editingLogId
        );
        if (!targetLog) return prev;

        if (targetLog.action === 'add') {
          const updatedLogs = prev.balanceLogs.map((l) =>
            l.id === targetLog.id
              ? {
                  ...l,
                  amount: payload.amount,
                  note: payload.note,
                  resultingBalance: l.previousBalance + payload.amount,
                }
              : l
          );
          return { ...prev, balanceLogs: updatedLogs };
        }

        // Editing a 'set' or 'edit' log updates the note and target balance
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
        return {
          ...prev,
          baseBalance: newBase,
          balanceLogs: updatedLogs,
        };
      }

      if (payload.mode === 'add') {
        const newLog: BalanceLog = {
          id: `bal-${Date.now()}`,
          action: 'add',
          amount: payload.amount,
          previousBalance: prevBal,
          resultingBalance: prevBal + payload.amount,
          note: payload.note,
          date: today,
          createdAt: nowIso,
        };
        return {
          ...prev,
          balanceLogs: [newLog, ...prev.balanceLogs],
        };
      }

      // 'set' or 'edit' adjusts baseBalance so currentBalance == payload.amount
      const newBase = computeBaseBalanceForTarget(
        payload.amount,
        prev.balanceLogs,
        prev.transactions
      );
      const newLog: BalanceLog = {
        id: `bal-${Date.now()}`,
        action: payload.mode,
        amount: payload.amount,
        previousBalance: prevBal,
        resultingBalance: payload.amount,
        note: payload.note,
        date: today,
        createdAt: nowIso,
      };
      return {
        ...prev,
        baseBalance: newBase,
        balanceLogs: [newLog, ...prev.balanceLogs],
      };
    });

    const label =
      payload.mode === 'add'
        ? `Saldo ditambah ${formatRupiah(payload.amount)}`
        : payload.mode === 'set'
          ? `Saldo ditetapkan menjadi ${formatRupiah(payload.amount)}`
          : `Saldo diperbarui menjadi ${formatRupiah(payload.amount)}`;
    showToast(label);
  };

  const handleUpdateBrandName = (newBrandName: string) => {
    const cleaned = newBrandName.trim() || 'KasBuku';
    setStore((prev) => ({
      ...prev,
      brandName: cleaned,
    }));
    showToast(`Nama aplikasi diperbarui menjadi "${cleaned}".`);
  };

  // Handlers: Exports
  const handleExportExcel = () => {
    exportReportToExcel(filteredTransactions, store.balanceLogs, {
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

  // Handlers: Google Sheets API (auto-resumes token when user session is saved)
  const resolveSheetsToken = async (): Promise<string | null> => {
    const existing = getAccessToken();
    if (existing) return existing;
    const resumed = await ensureSheetsAccessToken();
    if (resumed) {
      setHasToken(true);
      setSavedAccount(getSavedAccountMeta());
    }
    return resumed;
  };

  const handleCreateSpreadsheet = async (title: string) => {
    setSheetsBusy(true);
    setSheetsError(null);
    setSheetsStatus(null);
    try {
      const token = await resolveSheetsToken();
      if (!token) {
        setSheetsError('Silakan Sign in with Google terlebih dahulu.');
        return;
      }
      const meta = await createFinanceSpreadsheet(token, title);
      setAvailableTabs(meta.sheets);
      setStore((prev) => ({
        ...prev,
        spreadsheetId: meta.spreadsheetId,
        spreadsheetTitle: meta.title,
        sheetTabName: meta.sheets[0] ?? 'Transaksi',
      }));
      setSheetsStatus(
        `Spreadsheet "${meta.title}" berhasil dibuat. Klik "Sinkron ke Google Sheet" untuk mengirim data Anda.`
      );
    } catch (err: any) {
      if (err instanceof InsufficientScopeError) {
        markSheetsConsentRevoked();
        setHasToken(false);
      }
      setSheetsError(err?.message || 'Gagal membuat Google Sheet.');
    } finally {
      setSheetsBusy(false);
    }
  };

  const handleConnectSpreadsheet = async (idOrUrl: string) => {
    setSheetsBusy(true);
    setSheetsError(null);
    setSheetsStatus(null);
    try {
      const token = await resolveSheetsToken();
      if (!token) {
        setSheetsError('Silakan Sign in with Google terlebih dahulu.');
        return;
      }
      const meta = await fetchSpreadsheetMeta(token, idOrUrl);
      setAvailableTabs(meta.sheets);
      setStore((prev) => ({
        ...prev,
        spreadsheetId: meta.spreadsheetId,
        spreadsheetTitle: meta.title,
        sheetTabName: meta.sheets[0] ?? 'Transaksi',
      }));
      setSheetsStatus(
        `Terhubung ke "${meta.title}" (${meta.sheets.length} tab ditemukan).`
      );
    } catch (err: any) {
      if (err instanceof InsufficientScopeError) {
        markSheetsConsentRevoked();
        setHasToken(false);
      }
      setSheetsError(
        err?.message || 'Gagal menghubungkan spreadsheet. Periksa URL atau ID.'
      );
    } finally {
      setSheetsBusy(false);
    }
  };

  const handlePullFromSheet = async () => {
    if (!store.spreadsheetId) {
      setSheetsError('Hubungkan spreadsheet terlebih dahulu.');
      return;
    }
    setSheetsBusy(true);
    setSheetsError(null);
    setSheetsStatus(null);
    try {
      const token = await resolveSheetsToken();
      if (!token) {
        setSheetsError('Silakan Sign in with Google terlebih dahulu.');
        return;
      }
      const rows = await readTransactionsFromSheet(
        token,
        store.spreadsheetId,
        store.sheetTabName
      );
      if (rows.length === 0) {
        setSheetsStatus(
          `Tab "${store.sheetTabName}" belum memiliki baris transaksi.`
        );
      } else {
        setStore((prev) => ({
          ...prev,
          transactions: rows,
          lastSyncedAt: new Date().toISOString(),
        }));
        setSheetsStatus(
          `Berhasil memuat ${rows.length} baris transaksi dari tab "${store.sheetTabName}".`
        );
        showToast(`${rows.length} transaksi dimuat dari Google Sheets.`);
      }
    } catch (err: any) {
      if (err instanceof InsufficientScopeError) {
        markSheetsConsentRevoked();
        setHasToken(false);
      }
      setSheetsError(err?.message || 'Gagal membaca data dari Google Sheet.');
    } finally {
      setSheetsBusy(false);
    }
  };

  const handleConfirmPushToSheet = async () => {
    if (!store.spreadsheetId) {
      setConfirmSheetPushOpen(false);
      setSheetsError('Hubungkan spreadsheet terlebih dahulu.');
      return;
    }
    setSheetsBusy(true);
    setSheetsError(null);
    setSheetsStatus(null);
    try {
      const token = await resolveSheetsToken();
      if (!token) {
        setConfirmSheetPushOpen(false);
        setSheetsError('Silakan Sign in with Google terlebih dahulu.');
        return;
      }
      await writeTransactionsToSheet(
        token,
        store.spreadsheetId,
        store.sheetTabName,
        store.transactions,
        store.balanceLogs,
        currentBalance,
        availableTabs
      );
      const syncedAt = new Date().toISOString();
      setStore((prev) => ({ ...prev, lastSyncedAt: syncedAt }));
      setSheetsStatus(
        `Berhasil menyinkronkan ${store.transactions.length} transaksi ke "${store.spreadsheetTitle}" (${store.sheetTabName}).`
      );
      showToast('Data berhasil disinkronkan ke Google Sheets.');
    } catch (err: any) {
      if (err instanceof InsufficientScopeError) {
        markSheetsConsentRevoked();
        setHasToken(false);
      }
      setSheetsError(err?.message || 'Gagal menulis data ke Google Sheet.');
    } finally {
      setSheetsBusy(false);
      setConfirmSheetPushOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100 flex flex-col">
      <TopBar
        brandName={displayBrand}
        profile={activeProfile}
        isLoggingIn={isLoggingIn}
        onGoogleLogin={() => handleGoogleLogin('auto')}
        onOpenAccount={() => setLainnyaTab('account')}
      />

      <main className="flex-1">
        <HeroOverview
          currentBalance={currentBalance}
          totalExpense={summary.totalExpense}
          totalIncome={summary.totalIncome}
          netCashflow={summary.netCashflow}
          transactionCount={summary.count}
          rangeLabel={rangeLabel}
          onOpenBalanceModal={handleOpenBalanceModal}
          onOpenNewTransaction={() => {
            setEditingTransaction(null);
            setTxModalOpen(true);
          }}
        />

        <CashflowCharts
          transactions={filteredTransactions}
          range={activeRange}
          rangeLabel={rangeLabel}
        />

        <LedgerSheet
          transactions={filteredTransactions}
          balanceLogs={store.balanceLogs}
          activeRange={activeRange}
          rangeLabel={rangeLabel}
          searchQuery={searchQuery}
          totalExpense={summary.totalExpense}
          totalIncome={summary.totalIncome}
          netCashflow={summary.netCashflow}
          currentBalance={currentBalance}
          onRangeChange={setActiveRange}
          onSearchChange={setSearchQuery}
          onAddQuickTransaction={handleSaveTransaction}
          onEditTransaction={(tx) => {
            setEditingTransaction(tx);
            setTxModalOpen(true);
          }}
          onRequestDeleteTransaction={(tx) => setPendingDeleteTx(tx)}
          onEditBalanceLog={handleEditBalanceLog}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onOpenGoogleSheets={() => setLainnyaTab('sheets')}
        />

        <LainnyaSection
          activeTab={lainnyaTab}
          onTabChange={setLainnyaTab}
          brandName={displayBrand}
          onUpdateBrandName={handleUpdateBrandName}
          profile={activeProfile}
          isAuthenticated={Boolean(user || savedAccount)}
          hasToken={hasToken}
          isLoggingIn={isLoggingIn}
          spreadsheetId={store.spreadsheetId}
          spreadsheetTitle={store.spreadsheetTitle}
          sheetTabName={store.sheetTabName}
          availableTabs={availableTabs}
          lastSyncedAt={store.lastSyncedAt}
          isBusy={sheetsBusy}
          statusMessage={sheetsStatus}
          errorMessage={sheetsError}
          onGoogleLogin={() => handleGoogleLogin('auto')}
          onSwitchAccount={() => handleGoogleLogin('select_account')}
          onReconsentSheets={() => handleGoogleLogin('consent')}
          onGoogleLogout={handleGoogleLogout}
          onConnectSpreadsheet={handleConnectSpreadsheet}
          onCreateSpreadsheet={handleCreateSpreadsheet}
          onSelectTab={(tab) =>
            setStore((prev) => ({ ...prev, sheetTabName: tab }))
          }
          onPullFromSheet={handlePullFromSheet}
          onRequestPushToSheet={() => setConfirmSheetPushOpen(true)}
        />
      </main>

      <footer className="border-t border-white/[0.06] py-6 pb-20 md:pb-6 px-4 sm:px-8 text-center text-xs text-slate-500">
        {displayBrand} — Pembukuan Pengeluaran, Pemasukan, Saldo & Sinkronisasi Google Sheets
      </footer>

      <MobileBottomNav />

      {/* Modals */}
      <BalanceModal
        open={balanceModalOpen}
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
        open={txModalOpen}
        editingTransaction={editingTransaction}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteTx)}
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

      <ConfirmDialog
        open={confirmSheetPushOpen}
        title="Sinkronkan Data ke Google Sheets?"
        description={`Tindakan ini akan memperbarui isi tab "${store.sheetTabName}" pada spreadsheet "${
          store.spreadsheetTitle || store.spreadsheetId
        }" dengan data pembukuan Anda saat ini.`}
        details={[
          `Total baris transaksi yang akan ditulis: ${store.transactions.length} baris`,
          `Saldo kas saat ini: ${formatRupiah(currentBalance)}`,
          availableTabs.includes('RingkasanSaldo')
            ? `Tab "RingkasanSaldo" juga akan diperbarui (${store.balanceLogs.length} riwayat saldo)`
            : 'Tab target akan disusun ulang sesuai data terbaru',
        ]}
        confirmLabel="Ya, Perbarui Google Sheet"
        tone="primary"
        isLoading={sheetsBusy}
        onConfirm={handleConfirmPushToSheet}
        onCancel={() => setConfirmSheetPushOpen(false)}
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
            className="fixed bottom-18 md:bottom-5 left-4 right-4 sm:left-auto sm:right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#161920] border border-[#97F017]/40 px-4 py-3 text-xs font-semibold text-white shadow-2xl"
          >
            <CheckCircle2
              className="w-4 h-4 text-[#97F017] shrink-0"
              aria-hidden="true"
            />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
