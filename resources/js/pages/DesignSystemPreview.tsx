import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { 
  Calculator, 
  FileText, 
  UserCheck, 
  CreditCard, 
  Layers, 
  Palette, 
  Type, 
  Tag, 
  UploadCloud, 
  Hash, 
  Columns, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  ShieldCheck, 
  FileEdit, 
  Clock, 
  Send, 
  Archive, 
  Lock, 
  Unlock, 
  Check, 
  Copy, 
  BookOpen, 
  Sparkles, 
  HelpCircle,
  FileCheck,
  XCircle,
  LayoutDashboard
} from 'lucide-react';
import { 
  StatusBadge, 
  BadgeStatusType, 
  PDFUploader, 
  TabularFigure, 
  MetricCard, 
  PageHeader, 
  SplitScreenViewer 
} from '@/components/ui';

export default function DesignSystemPreview() {
  // Navigation active anchor
  const [activeSection, setActiveSection] = useState<string>('colors');

  // Interactive PDFUploader state
  const [demoFile, setDemoFile] = useState<File | null>(null);

  // Interactive SplitScreenViewer Rubric State
  const [scoreUrgensi, setScoreUrgensi] = useState<number>(88);
  const [scoreMetode, setScoreMetode] = useState<number>(92);
  const [scoreKelayakan, setScoreKelayakan] = useState<number>(85);
  const [reviewerNotes, setReviewerNotes] = useState<string>(
    'Metodologi penelitian telah terstruktur dengan baik. Integrasi data multi-kampus memberikan nilai kebaruan yang signifikan bagi institusi.'
  );
  const [coiAcknowledged, setCoiAcknowledged] = useState<boolean>(true);
  const [recommendation, setRecommendation] = useState<string>('Lolos_Didanai');
  const [formSaved, setFormSaved] = useState<boolean>(false);

  // Copied token notification
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Calculated aggregate score for rubric (35% + 35% + 30%)
  const aggregateScore = Number((scoreUrgensi * 0.35 + scoreMetode * 0.35 + scoreKelayakan * 0.3).toFixed(2));

  // 14 Status list
  const allStatuses: {
    status: BadgeStatusType;
    label: string;
    phase: string;
    rule: string;
  }[] = [
    { status: 'Draft', label: '[DRAFT]', phase: 'Fase 1: Pengusulan', rule: 'Dapat diedit bebas oleh pengusul' },
    { status: 'Submitted', label: '[DIAJUKAN]', phase: 'Fase 1: Pengusulan', rule: 'Terkunci dari penyuntingan' },
    { status: 'In_Review', label: '[SEDANG DIREVIEW]', phase: 'Fase 2: Penilaian', rule: 'Plotting 2 reviewer aktif (Bebas CoI)' },
    { status: 'Lolos_Didanai', label: '[LOLOS DIDANAI]', phase: 'Fase 2: Penilaian', rule: 'Persetujuan pleno penetapan penerima' },
    { status: 'Ditolak', label: '[DITOLAK]', phase: 'Fase 2: Penilaian', rule: 'Tidak memenuhi ambang batas passing grade' },
    { status: 'Revisi', label: '[PERLU REVISI]', phase: 'Fase 2: Penilaian', rule: 'Memerlukan perbaikan dokumen dalam batas waktu' },
    { status: 'Contracted', label: '[TERKONTRAK]', phase: 'Fase 3: Kontrak', rule: 'Penandatanganan perjanjian riset resmi' },
    { status: 'Disbursed_T1', label: '[CAIR TERMIN 1]', phase: 'Fase 4: Pendanaan', rule: 'Penyaluran 70% pagu dana riset' },
    { status: 'Disbursed_T2', label: '[CAIR TERMIN 2]', phase: 'Fase 4: Pendanaan', rule: 'Monev Gatekeeper: Wajib Monev Approved' },
    { status: 'Monev_Approved', label: '[MONEV DISETUJUI]', phase: 'Fase 5: Monev', rule: 'Laporan kemajuan dinilai memenuhi syarat' },
    { status: 'Monev_Locked', label: '[TERKUNCI MONEV]', phase: 'Fase 5: Monev', rule: 'Batas akhir unggah monev telah berakhir' },
    { status: 'Output_Verified', label: '[LUARAN TERVERIFIKASI]', phase: 'Fase 6: Luaran', rule: 'Verifikasi DOI / ISBN / Nomor HKI unik' },
    { status: 'Completed_SKTS', label: '[SELESAI (SKTS)]', phase: 'Fase 6: Luaran', rule: 'Read-Only Archive: Terkunci permanen' },
    { status: 'Terminated', label: '[FORCE MAJEURE / DIBATALKAN]', phase: 'Kasus Batas', rule: 'Riset dihentikan resmi oleh keputusan LPPM' },
  ];

  const [statusFilter, setStatusFilter] = useState<'all' | 'usulan' | 'kontrak' | 'monev' | 'selesai'>('all');

  const filteredStatuses = allStatuses.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'usulan') return ['Draft', 'Submitted', 'In_Review', 'Lolos_Didanai', 'Ditolak', 'Revisi'].includes(item.status);
    if (statusFilter === 'kontrak') return ['Contracted', 'Disbursed_T1', 'Disbursed_T2'].includes(item.status);
    if (statusFilter === 'monev') return ['Monev_Approved', 'Monev_Locked', 'Output_Verified'].includes(item.status);
    if (statusFilter === 'selesai') return ['Completed_SKTS', 'Terminated'].includes(item.status);
    return true;
  });

  const navItems = [
    { id: 'colors', label: '1. Palet Warna', icon: Palette },
    { id: 'typography', label: '2. Tipografi Ganda', icon: Type },
    { id: 'badges', label: '3. StatusBadge (14 Status)', icon: Tag },
    { id: 'uploader', label: '4. PDFUploader (10 MB)', icon: UploadCloud },
    { id: 'figures', label: '5. TabularFigure (Anti-CLS)', icon: Hash },
    { id: 'metrics', label: '6. MetricCard (Bento Grid)', icon: LayoutDashboard },
    { id: 'splitscreen', label: '7. SplitScreenViewer', icon: Columns },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Head title="Katalog Sistem Desain: Hybrid Scholarly Enterprise" />

      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-blue-900 flex items-center justify-center text-white font-mono font-bold text-xs">
                RPL
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 block">
                  STANDALONE SPEC 2026
                </span>
                <span className="text-sm font-sans font-bold text-slate-900 tracking-tight">
                  Design System Preview Gate
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1.5 text-xs font-medium">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                [WCAG AAA]
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                [ZERO EMOJI]
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-mono">
                [21 TABEL BERSIH]
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="#splitscreen"
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-xs"
              >
                <span>Uji Ruang Telaah</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </div>
          </div>

          {/* Sub-bar Quick Jump Navigation */}
          <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Page Header Component Showcase */}
        <PageHeader
          title="Katalog Sistem Desain: Hybrid Scholarly Enterprise"
          isEditorialSerif={true}
          breadcrumbs={[
            { label: 'SIM-Penelitian', href: '/' },
            { label: 'Pusat Arsitektur', href: '#' },
            { label: 'Katalog Komponen Terstandarisasi' },
          ]}
          subtitle="Verifikasi Gerbang Sistem Desain (Design System Preview Gate) sesuai Cetak Biru docs/technical/design.md. Seluruh komponen mematuhi kontras WCAG AAA, tipografi ganda editorial-enterprise, dan Strict Zero Emoji Invariant."
          badge={
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-sans font-bold bg-blue-900 text-white tracking-wider uppercase">
              Baseline v2.0
            </span>
          }
          actions={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => copyToClipboard('docs/technical/design.md')}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                title="Salin path dokumen spesifikasi"
              >
                {copiedToken === 'docs/technical/design.md' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                    <span>Path Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                    <span>Spesifikasi Desain</span>
                  </>
                )}
              </button>
            </div>
          }
        />

        {/* SECTION 1: Palet Warna Tokens */}
        <section id="colors" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Palette className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-sans font-bold text-slate-900">
                1. Palet Warna Semantik & Cool Slate Tokens
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">[WCAG AAA COMPLIANT]</span>
          </div>

          <p className="text-sm text-slate-600">
            Palet Cool Slate dirancang untuk keheningan kognitif saat membaca dokumen tebal dan ketegasan garis batas operasional. Dilarang menggunakan gradien ungu/pink liar atau teks abu-abu di atas abu-abu.
          </p>

          {/* Group 1: Cool Slate Surfaces */}
          <div className="space-y-3">
            <h3 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
              Token Permukaan (Cool Slate Foundation)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {[
                { token: 'surface-base', hex: '#F8FAFC', tailwind: 'bg-slate-50', role: 'Kanvas utama seluruh viewport' },
                { token: 'surface-card', hex: '#FFFFFF', tailwind: 'bg-white', role: 'Permukaan kartu & modal' },
                { token: 'surface-elevated', hex: '#F1F5F9', tailwind: 'bg-slate-100', role: 'Header tabel & panel filter' },
                { token: 'surface-muted', hex: '#E2E8F0', tailwind: 'bg-slate-200', role: 'Placeholder & kondisi disable' },
                { token: 'surface-sidebar', hex: '#0F172A', tailwind: 'bg-slate-900', role: 'Bilah navigasi institusional' },
              ].map((swatch) => (
                <div
                  key={swatch.token}
                  className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-xs"
                >
                  <div
                    className={`h-16 w-full rounded border border-slate-200 flex items-center justify-center font-mono text-xs ${
                      swatch.token === 'surface-sidebar' ? 'bg-slate-900 text-white' : swatch.tailwind
                    }`}
                  >
                    {swatch.hex}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-900 block truncate">
                      {swatch.token}
                    </span>
                    <span className="text-xs text-slate-500 font-sans block mt-0.5 line-clamp-2">
                      {swatch.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Brand Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
              Token Identitas Brand Institusi (Academic Navy & Emerald)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {[
                { token: 'brand-primary', hex: '#1E3A8A', tailwind: 'bg-blue-900 text-white', label: 'Primary Navy' },
                { token: 'brand-primary-hover', hex: '#1E40AF', tailwind: 'bg-blue-800 text-white', label: 'Primary Hover' },
                { token: 'brand-primary-light', hex: '#EFF6FF', tailwind: 'bg-blue-50 text-blue-900', label: 'Primary Light' },
                { token: 'brand-accent', hex: '#059669', tailwind: 'bg-emerald-600 text-white', label: 'Academic Emerald' },
                { token: 'brand-accent-hover', hex: '#047857', tailwind: 'bg-emerald-700 text-white', label: 'Emerald Hover' },
                { token: 'brand-accent-light', hex: '#ECFDF5', tailwind: 'bg-emerald-50 text-emerald-800', label: 'Emerald Light' },
              ].map((swatch) => (
                <div
                  key={swatch.token}
                  className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs"
                >
                  <div className={`h-14 w-full rounded flex items-center justify-center font-mono text-xs font-bold ${swatch.tailwind}`}>
                    {swatch.hex}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-900 block truncate">
                      {swatch.token}
                    </span>
                    <span className="text-xs text-slate-500 block truncate">
                      {swatch.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 3: Semantic System States */}
          <div className="space-y-3">
            <h3 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
              Token Keadaan Sistem (System Semantic States)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {[
                { name: 'Sukses / Lolos / Verified', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200', hexText: '#059669', hexBg: '#ECFDF5' },
                { name: 'Info / Submitted / Kontrak', classes: 'bg-sky-50 text-sky-800 border-sky-200', hexText: '#0284C7', hexBg: '#F0F9FF' },
                { name: 'Warning / Review / Revisi', classes: 'bg-amber-50 text-amber-800 border-amber-200', hexText: '#D97706', hexBg: '#FFFBEB' },
                { name: 'Danger / Ditolak / Overdue', classes: 'bg-rose-50 text-rose-800 border-rose-200', hexText: '#E11D48', hexBg: '#FFF1F2' },
                { name: 'Neutral / Draft / Arsip', classes: 'bg-slate-100 text-slate-800 border-slate-300', hexText: '#475569', hexBg: '#F1F5F9' },
              ].map((state) => (
                <div
                  key={state.name}
                  className={`p-3.5 rounded-lg border flex flex-col justify-between ${state.classes}`}
                >
                  <div className="font-sans text-xs font-bold tracking-wide uppercase">
                    {state.name}
                  </div>
                  <div className="mt-3 pt-2 border-t border-current/15 font-mono text-xs flex justify-between">
                    <span>Teks: {state.hexText}</span>
                    <span>Bg: {state.hexBg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: Tipografi Ganda */}
        <section id="typography" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Type className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-sans font-bold text-slate-900">
                2. Disiplin Tipografi Hibrida (Dual-Personality Typography Scale)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">[NEWSREADER &bull; PLUS JAKARTA &bull; JETBRAINS]</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Serif Column: Scholarly */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-900">
                  DIMENSI SCHOLARLY
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                  Newsreader Serif
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">Judul Skema / Proposal Riset (H1)</span>
                  <h3 className="font-serif text-2xl font-semibold text-slate-900 leading-snug">
                    Rancang Bangun Kecerdasan Artifisial untuk Deteksi Penyakit Padi Multi-Situs
                  </h3>
                </div>
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">Substansi Abstrak & Narasi Ilmiah</span>
                  <p className="font-serif text-sm text-slate-800 leading-relaxed italic border-l-2 border-blue-900 pl-3">
                    "Penelitian ini merumuskan metodologi evaluasi berbasis citra multispektral UAV dan model transformer terdistribusi antar institusi pendidikan tinggi Muhammadiyah guna meningkatkan ketahanan pangan berkelanjutan."
                  </p>
                </div>
                <div className="pt-2 text-xs font-sans text-slate-500">
                  Penggunaan: Judul riset, abstrak, sitasi jurnal ilmiah, sertifikat SKTS.
                </div>
              </div>
            </div>

            {/* Sans Column: Enterprise */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                  DIMENSI ENTERPRISE
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                  Plus Jakarta Sans
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">Heading Operasional Modul</span>
                  <h4 className="font-sans text-base font-bold text-slate-900">
                    Formulir Evaluasi Usulan dan Pelaporan Capaian Luaran
                  </h4>
                </div>
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">Label Input Berbobot</span>
                  <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider">
                    NOMOR INDUK DOSEN NASIONAL (NIDN) <span className="text-rose-600">*</span>
                  </label>
                  <div className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-sans text-slate-800">
                    0612088501 - Dr. Ir. Hendra Prasetyo, M.T.
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button className="px-3 py-1.5 bg-blue-900 text-white text-xs font-sans font-semibold rounded hover:bg-blue-800">
                    Simpan Perubahan
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-sans font-medium rounded hover:bg-slate-50">
                    Batal
                  </button>
                </div>
                <div className="pt-2 text-xs font-sans text-slate-500">
                  Penggunaan: Form wizards, tabel, tombol CTA, navigasi, dialog modal.
                </div>
              </div>
            </div>

            {/* Mono Column: Tabular & Financial */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                  DIMENSI TABULAR (ANTI-CLS)
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                  JetBrains Mono
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">Nominal Anggaran Riset</span>
                  <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    Rp75.000.000,00
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Termin 1 (70%):</span>
                    <span className="font-semibold text-slate-900 tabular-nums">Rp52.500.000,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Termin 2 (30%):</span>
                    <span className="font-semibold text-slate-900 tabular-nums">Rp22.500.000,00</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Passing Score:</span>
                    <span className="font-bold text-emerald-700 tabular-nums">87.50 / 100.00</span>
                  </div>
                </div>
                <div className="pt-2 text-xs font-sans text-slate-500">
                  Penggunaan: Keuangan rupiah, passing score, persentase, kode hash DOI/ISBN.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: StatusBadge (14 Status) */}
        <section id="badges" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  3. Komponen StatusBadge (14 State Siklus Hidup Penelitian)
                </h2>
                <p className="text-xs text-slate-500">
                  Format teks terstruktur [STATUS] dengan mikro-ikon semantik dan aturan pembatasan alur.
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'Semua (14)' },
                { id: 'usulan', label: 'Usulan & Review (6)' },
                { id: 'kontrak', label: 'Kontrak & Dana (3)' },
                { id: 'monev', label: 'Monev & Luaran (3)' },
                { id: 'selesai', label: 'Penyelesaian (2)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-blue-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-sans font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Status Key</th>
                    <th className="py-3 px-4">Ukuran Small (`sm`)</th>
                    <th className="py-3 px-4">Ukuran Medium (`md`)</th>
                    <th className="py-3 px-4">Fase Siklus Hidup</th>
                    <th className="py-3 px-4">Aturan Rekayasa Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {filteredStatuses.map((item) => (
                    <tr key={item.status} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {item.status}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="md" />
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.phase}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {item.rule}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: PDFUploader */}
        <section id="uploader" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  4. Komponen PDFUploader (Validasi Format .pdf & Batas 10 MB)
                </h2>
                <p className="text-xs text-slate-500">
                  Komponen drag-and-drop khusus berkas tunggal .pdf (10.485.760 bytes) dengan feedback status interaktif.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">[UPLOAD GUARD AKTIF]</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Instance 1: Interactive Live Demo */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-sans font-bold text-blue-900 uppercase tracking-wider">
                  Uji Coba Unggah Interaktif
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
                  [SIAP INPUT]
                </span>
              </div>
              <PDFUploader
                value={demoFile}
                onChange={(file) => setDemoFile(file)}
                maxSizeMB={10}
                label="Dokumen Proposal Riset"
                required={true}
                helperText="Coba unggah berkas PDF asli Anda di sini (maks 10 MB)."
              />
              {demoFile && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 space-y-1">
                  <div className="font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Berkas Terverifikasi Klien</span>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-700">
                    Ukuran: {(demoFile.size / (1024 * 1024)).toFixed(2)} MB &bull; MIME: {demoFile.type || 'application/pdf'}
                  </div>
                </div>
              )}
            </div>

            {/* Instance 2: Pre-filled State */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
                  Kondisi Berkas Tersimpan
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                  [PRE-FILLED]
                </span>
              </div>
              <PDFUploader
                value={null}
                existingFileUrl="/sample-proposal.pdf"
                onChange={() => {}}
                maxSizeMB={10}
                label="Laporan Kemajuan Monev"
                helperText="Berkas yang telah diunggah tersimpan aman di cloud storage."
              />
              <p className="text-xs text-slate-500 font-sans">
                Menampilkan tampilan berkas proposal yang sebelumnya telah diunggah dan tersimpan pada basis data.
              </p>
            </div>

            {/* Instance 3: Disabled / Locked State */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
                  Kondisi Terkunci (Read-Only)
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono">
                  [TERKUNCI]
                </span>
              </div>
              <PDFUploader
                value={null}
                onChange={() => {}}
                maxSizeMB={10}
                disabled={true}
                label="Dokumen Kontrak Perjanjian Riset"
                helperText="Periode pengunggahan berkas telah ditutup oleh LPPM."
              />
              <p className="text-xs text-slate-500 font-sans">
                Kondisi nonaktif otomatis diterapkan saat usulan telah disetujui, monev terkunci, atau terbit SKTS.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: TabularFigure */}
        <section id="figures" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  5. Komponen TabularFigure (Anti-CLS Monospace Numbers)
                </h2>
                <p className="text-xs text-slate-500">
                  Penyajian presisi angka keuangan Rupiah, passing score penilai, persentase, dan bilangan bulat tanpa pergeseran layout (*Zero Cumulative Layout Shift*).
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">[INTL.NUMBERFORMAT ID-ID]</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card Currency */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
              <span className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                Format Mata Uang (IDR)
              </span>
              <div className="py-2">
                <TabularFigure value={125000000} type="currency" size="xl" weight="bold" align="left" />
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Pagu total skema riset kompetitif universitas tahun 2026.
              </p>
            </div>

            {/* Card Score */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
              <span className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                Nilai / Skor Evaluasi (Score)
              </span>
              <div className="py-2">
                <TabularFigure value={91.75} type="score" size="xl" weight="bold" align="left" suffix=" / 100.00" />
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Rata-rata rubrik penilaian dari 2 penilai independen.
              </p>
            </div>

            {/* Card Percentage */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
              <span className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                Persentase Termin (Percentage)
              </span>
              <div className="py-2">
                <TabularFigure value={70.0} type="percentage" size="xl" weight="bold" align="left" prefix="Alokasi " />
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Formula pencairan Termin 1 pasca kontrak resmi diteken.
              </p>
            </div>

            {/* Card Integer */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
              <span className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                Kuantitas Data (Integer)
              </span>
              <div className="py-2">
                <TabularFigure value={1420} type="integer" size="xl" weight="bold" align="left" suffix=" Usulan" />
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Total rekapan usulan masuk pada periode penerimaan 2026.
              </p>
            </div>
          </div>

          {/* Demonstration: Zero-CLS Alignment Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">
                  Matriks Anggaran & Termin Pendanaan (Tabel Uji Tabular-Nums)
                </h4>
                <p className="text-xs text-slate-500">
                  Perhatikan kolom nominal dan persentase yang sejajar presisi ke kanan tanpa layout jitter.
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                [ZERO CLS PASSED]
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-sans font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Komponen Anggaran</th>
                  <th className="py-2.5 px-4 text-center">Porsi (%)</th>
                  <th className="py-2.5 px-4 text-right">Alokasi Rupiah</th>
                  <th className="py-2.5 px-4 text-right">Realisasi Lapangan</th>
                  <th className="py-2.5 px-4 text-center">Status Pencairan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {[
                  { name: 'Termin 1 (Pencairan Awal)', porsi: 70.0, alokasi: 35000000, realisasi: 35000000, status: 'Disbursed_T1' as BadgeStatusType },
                  { name: 'Termin 2 (Monev Gatekeeper)', porsi: 30.0, alokasi: 15000000, realisasi: 0, status: 'Monev_Locked' as BadgeStatusType },
                  { name: 'Honorarium Pembantu Peneliti', porsi: 20.0, alokasi: 10000000, realisasi: 10000000, status: 'Disbursed_T1' as BadgeStatusType },
                  { name: 'Belanja Bahan Habis Pakai', porsi: 40.0, alokasi: 20000000, realisasi: 18450000, status: 'Disbursed_T1' as BadgeStatusType },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{row.name}</td>
                    <td className="py-2.5 px-4 text-center">
                      <TabularFigure value={row.porsi} type="percentage" size="sm" align="center" />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <TabularFigure value={row.alokasi} type="currency" size="sm" align="right" weight="semibold" />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <TabularFigure value={row.realisasi} type="currency" size="sm" align="right" />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 6: MetricCard Bento Grid */}
        <section id="metrics" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  6. Komponen MetricCard (Bento Grid Dasbor Riset)
                </h2>
                <p className="text-xs text-slate-500">
                  Visualisasi indikator kinerja utama penelitian dengan mikro-ikon tematik dan lencana kontekstual.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">[BENTO 4-KOLOM]</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Pagu Anggaran Skema"
              value={750000000}
              type="currency"
              icon={Calculator}
              iconBgClass="bg-blue-50"
              iconColorClass="text-blue-900"
              caption="Total alokasi dana kompetitif tahun 2026"
              badgeText="PAGU RESMI"
              badgeVariant="neutral"
            />
            <MetricCard
              title="Total Usulan Proposal"
              value={142}
              type="integer"
              icon={FileText}
              iconBgClass="bg-sky-50"
              iconColorClass="text-sky-700"
              caption="Masuk pada periode gelombang 1"
              badgeText="+18% DARI 2025"
              badgeVariant="success"
            />
            <MetricCard
              title="Reviewer Aktif Terplotting"
              value={28}
              type="integer"
              icon={UserCheck}
              iconBgClass="bg-amber-50"
              iconColorClass="text-amber-800"
              caption="100% bebas dari benturan kepentingan (CoI)"
              badgeText="SIAP MONEV"
              badgeVariant="warning"
            />
            <MetricCard
              title="Dana Disetujui Termin 1"
              value={315000000}
              type="currency"
              icon={CreditCard}
              iconBgClass="bg-emerald-50"
              iconColorClass="text-emerald-700"
              caption="Alokasi 70% setelah penandatanganan kontrak"
              badgeText="70% CAIR"
              badgeVariant="success"
            />
          </div>
        </section>

        {/* SECTION 7: SplitScreenViewer */}
        <section id="splitscreen" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Columns className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  7. Komponen SplitScreenViewer (Ruang Telaah Penilai & Verifikasi)
                </h2>
                <p className="text-xs text-slate-500">
                  Rasio layar 60% pembaca PDF di sisi kiri dan 40% rubrik penilaian interaktif di sisi kanan. Mendukung pembesaran layar penuh (*Full Width Toggle*).
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">[RASIO 60:40 &bull; INTERAKTIF]</span>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            {/* Embedded Live Split Screen Viewer */}
            <div className="h-[620px] w-full">
              <SplitScreenViewer
                pdfUrl="/sample-proposal.pdf"
                documentTitle="Proposal-Riset-Penelitian-Dasar-2026.pdf"
                headerActions={
                  <div className="flex items-center space-x-2 mr-2">
                    <StatusBadge status="In_Review" size="sm" />
                    <span className="text-xs font-mono text-slate-500">Plotting Reviewer 1</span>
                  </div>
                }
                formContent={
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-sans text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Rubrik Penilaian Usulan Riset
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Isikan skor per kriteria berikut berdasarkan substansi dokumen proposal di sebelah kiri.
                      </p>
                    </div>

                    {/* Kriteria 1 */}
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-700">
                          1. Urgensi & Kebaruan Riset (Bobot 35%)
                        </label>
                        <TabularFigure value={scoreUrgensi} type="score" size="sm" weight="bold" />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scoreUrgensi}
                        onChange={(e) => {
                          setScoreUrgensi(Number(e.target.value));
                          setFormSaved(false);
                        }}
                        className="w-full accent-blue-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0 (Kurang)</span>
                        <span>50 (Cukup)</span>
                        <span>100 (Sangat Baik)</span>
                      </div>
                    </div>

                    {/* Kriteria 2 */}
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-700">
                          2. Metode & Peta Jalan Riset (Bobot 35%)
                        </label>
                        <TabularFigure value={scoreMetode} type="score" size="sm" weight="bold" />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scoreMetode}
                        onChange={(e) => {
                          setScoreMetode(Number(e.target.value));
                          setFormSaved(false);
                        }}
                        className="w-full accent-blue-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0 (Kurang)</span>
                        <span>50 (Cukup)</span>
                        <span>100 (Sangat Baik)</span>
                      </div>
                    </div>

                    {/* Kriteria 3 */}
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-700">
                          3. Kelayakan Anggaran & Target Luaran (Bobot 30%)
                        </label>
                        <TabularFigure value={scoreKelayakan} type="score" size="sm" weight="bold" />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scoreKelayakan}
                        onChange={(e) => {
                          setScoreKelayakan(Number(e.target.value));
                          setFormSaved(false);
                        }}
                        className="w-full accent-blue-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0 (Kurang)</span>
                        <span>50 (Cukup)</span>
                        <span>100 (Sangat Baik)</span>
                      </div>
                    </div>

                    {/* Total Aggregate Score Display */}
                    <div className="p-3.5 bg-blue-50/75 border border-blue-200 rounded-md flex items-center justify-between">
                      <div>
                        <span className="text-xs font-sans font-semibold text-blue-900 block">
                          Skor Tertimbang Akhir:
                        </span>
                        <span className="text-[11px] text-slate-600 font-sans">
                          Passing Grade Minimum: 70.00
                        </span>
                      </div>
                      <TabularFigure
                        value={aggregateScore}
                        type="score"
                        size="2xl"
                        weight="bold"
                        className={aggregateScore >= 70 ? 'text-emerald-700' : 'text-rose-700'}
                      />
                    </div>

                    {/* Recommendation Select */}
                    <div className="space-y-1">
                      <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider">
                        Rekomendasi Penilai <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={recommendation}
                        onChange={(e) => {
                          setRecommendation(e.target.value);
                          setFormSaved(false);
                        }}
                        className="w-full text-xs font-sans rounded border-slate-300 bg-white py-1.5 px-2.5 focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                      >
                        <option value="Lolos_Didanai">Rekomendasi Lolos Didanai Penuh</option>
                        <option value="Revisi">Perlu Revisi Dokumen Proposal</option>
                        <option value="Ditolak">Tidak Direkomendasikan (Ditolak)</option>
                      </select>
                    </div>

                    {/* Reviewer Qualitative Feedback */}
                    <div className="space-y-1">
                      <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider">
                        Catatan Evaluasi Kualitatif
                      </label>
                      <textarea
                        rows={3}
                        value={reviewerNotes}
                        onChange={(e) => {
                          setReviewerNotes(e.target.value);
                          setFormSaved(false);
                        }}
                        className="w-full text-xs font-sans rounded border-slate-300 p-2.5 focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                        placeholder="Berikan masukan substansial mengenai metodologi dan anggaran..."
                      />
                    </div>

                    {/* Conflict of Interest Checkbox */}
                    <div className="flex items-start space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded">
                      <input
                        type="checkbox"
                        id="coi_ack"
                        checked={coiAcknowledged}
                        onChange={(e) => setCoiAcknowledged(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <label htmlFor="coi_ack" className="text-[11px] text-slate-700 font-sans leading-tight cursor-pointer">
                        Saya menyatakan secara jujur tidak memiliki benturan kepentingan (Conflict of Interest) dengan pengusul dan tim peneliti usulan ini.
                      </label>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormSaved(true)}
                        className="flex-1 py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-sans font-semibold transition-colors shadow-xs"
                      >
                        {formSaved ? 'Tersimpan [DRAF PENILAIAN]' : 'Simpan Draf Penilaian'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormSaved(true);
                          alert('Penilaian resmi berhasil dikirim ke LPPM.');
                        }}
                        className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-sans font-semibold transition-colors shadow-xs"
                      >
                        Kirim Nilai
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* Footer Audit Information */}
        <footer className="pt-8 pb-12 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans">
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">
              Sistem Penelitian Terintegrasi Multi-Kampus (SIM-Penelitian Standalone)
            </p>
            <p>
              Design System Preview Gate &bull; Mematuhi Aturan RPL-2026 dan Bebas 100% Simbol Emoji.
            </p>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Build: Oct 2026 &bull; Baseline: docs/technical/design.md
          </div>
        </footer>
      </main>
    </div>
  );
}
