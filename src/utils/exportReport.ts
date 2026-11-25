import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BalanceLog, Transaction } from '../types/finance';
import {
  formatIndonesianDate,
  formatRupiah,
  getTodayISODate,
} from './finance';

export interface ExportSummary {
  brandName?: string;
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  currentBalance: number;
  rangeLabel: string;
}

export function exportReportToExcel(
  transactions: Transaction[],
  balanceLogs: BalanceLog[],
  summary: ExportSummary
): void {
  const wb = XLSX.utils.book_new();

  const txRows = transactions.map((tx, idx) => ({
    No: idx + 1,
    Tanggal: formatIndonesianDate(tx.date),
    Keperluan: tx.description,
    Kategori: tx.category,
    Jenis: tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    'Nominal (Rp)': tx.amount,
    'Format Rupiah': formatRupiah(tx.amount),
  }));

  txRows.push({
    No: transactions.length + 1,
    Tanggal: 'RINGKASAN',
    Keperluan: `Total Pengeluaran (${summary.rangeLabel})`,
    Kategori: '-',
    Jenis: 'Pengeluaran',
    'Nominal (Rp)': summary.totalExpense,
    'Format Rupiah': formatRupiah(summary.totalExpense),
  });

  txRows.push({
    No: transactions.length + 2,
    Tanggal: 'RINGKASAN',
    Keperluan: `Total Pemasukan (${summary.rangeLabel})`,
    Kategori: '-',
    Jenis: 'Pemasukan',
    'Nominal (Rp)': summary.totalIncome,
    'Format Rupiah': formatRupiah(summary.totalIncome),
  });

  const wsTx = XLSX.utils.json_to_sheet(txRows);
  wsTx['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 34 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Laporan Transaksi');

  const summaryRows = [
    { Keterangan: 'Periode Laporan', Nilai: summary.rangeLabel },
    { Keterangan: 'Tanggal Ekspor', Nilai: formatIndonesianDate(getTodayISODate()) },
    { Keterangan: 'Saldo Saat Ini', Nilai: formatRupiah(summary.currentBalance) },
    { Keterangan: 'Total Pemasukan', Nilai: formatRupiah(summary.totalIncome) },
    { Keterangan: 'Total Pengeluaran', Nilai: formatRupiah(summary.totalExpense) },
    { Keterangan: 'Arus Kas Bersih', Nilai: formatRupiah(summary.netCashflow) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 26 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Keuangan');

  if (balanceLogs.length > 0) {
    const saldoRows = balanceLogs.map((log) => ({
      Tanggal: formatIndonesianDate(log.date),
      Aksi:
        log.action === 'set'
          ? 'Set Saldo'
          : log.action === 'add'
            ? 'Add Saldo'
            : 'Edit Saldo',
      Keterangan: log.note || '-',
      Nominal: formatRupiah(log.amount),
      'Saldo Sebelum': formatRupiah(log.previousBalance),
      'Saldo Akhir': formatRupiah(log.resultingBalance),
    }));
    const wsSaldo = XLSX.utils.json_to_sheet(saldoRows);
    wsSaldo['!cols'] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSaldo, 'Riwayat Saldo');
  }

  const filename = `Laporan-Keuangan-${summary.rangeLabel
    .toLowerCase()
    .replace(/\s+/g, '-')}-${getTodayISODate()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportReportToPDF(
  transactions: Transaction[],
  summary: ExportSummary
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  doc.setFillColor(15, 18, 25);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 96, 'F');

  const brand = summary.brandName?.trim() || 'KasBuku';
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${brand} — Laporan Pembukuan Keuangan`, 40, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 200, 215);
  doc.text(
    `Periode: ${summary.rangeLabel}  |  Dicetak: ${formatIndonesianDate(
      getTodayISODate()
    )}`,
    40,
    64
  );

  // Summary strip
  doc.setTextColor(17, 19, 24);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Saat Ini: ${formatRupiah(summary.currentBalance)}`, 40, 122);
  doc.text(`Total Pemasukan: ${formatRupiah(summary.totalIncome)}`, 215, 122);
  doc.text(`Total Pengeluaran: ${formatRupiah(summary.totalExpense)}`, 390, 122);

  autoTable(doc, {
    startY: 140,
    head: [['No', 'Tanggal', 'Keperluan', 'Kategori', 'Jenis', 'Nominal']],
    body: transactions.map((tx, index) => [
      String(index + 1),
      formatIndonesianDate(tx.date),
      tx.description,
      tx.category,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      formatRupiah(tx.amount),
    ]),
    foot: [
      [
        '',
        '',
        'TOTAL PENGELUARAN',
        '',
        'Pengeluaran',
        formatRupiah(summary.totalExpense),
      ],
      [
        '',
        '',
        'TOTAL PEMASUKAN',
        '',
        'Pemasukan',
        formatRupiah(summary.totalIncome),
      ],
      [
        '',
        '',
        'ARUS KAS BERSIH PERIODE',
        '',
        '',
        formatRupiah(summary.netCashflow),
      ],
    ],
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: [24, 28, 36],
    },
    headStyles: {
      fillColor: [22, 25, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 32 },
      5: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const filename = `Laporan-Keuangan-${summary.rangeLabel
    .toLowerCase()
    .replace(/\s+/g, '-')}-${getTodayISODate()}.pdf`;
  doc.save(filename);
}
