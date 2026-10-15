import { MetricCard } from '@/components/UI/MetricCard';
import { StatusBadge } from '@/components/UI/StatusBadge';
import { TabularFigure } from '@/components/UI/TabularFigure';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BookOpen,
    Building2,
    CheckCircle2,
    FileText,
    GraduationCap,
    LayoutDashboard,
    Layers,
    Lock,
    Search,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

interface ResearchSchemeItem {
    id: number;
    nama_skema?: string;
    name?: string;
    deskripsi?: string;
    description?: string;
    biaya_maksimal?: string | number;
    max_funding?: string | number;
    tanggal_mulai?: string;
    tanggal_selesai?: string;
    university?: {
        id: number;
        name: string;
        code: string;
    } | null;
}

interface WelcomeProps extends SharedData {
    overallStats?: {
        totalUniversities?: number;
        totalSchemas?: number;
        totalProposals?: number;
        totalOutputs?: number;
    };
    activeSchemas?: ResearchSchemeItem[];
}

export default function Welcome() {
    const { auth, overallStats, activeSchemas } = usePage<WelcomeProps>().props;
    const [searchFilter, setSearchFilter] = useState('');

    const stats = overallStats || {
        totalUniversities: 0,
        totalSchemas: 0,
        totalProposals: 0,
        totalOutputs: 0,
    };

    const schemes = activeSchemas || [];
    const filteredSchemes = schemes.filter((s) => {
        const title = (s.nama_skema || s.name || '').toLowerCase();
        const desc = (s.deskripsi || s.description || '').toLowerCase();
        const query = searchFilter.toLowerCase();
        return title.includes(query) || desc.includes(query);
    });

    return (
        <>
            <Head title="SIM-Penelitian - Portal Riset Terintegrasi PTMA">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-900 selection:text-white dark:bg-slate-950 dark:text-slate-100">
                {/* TOP NAVIGATION BAR */}
                <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-serif text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                    SIM-Penelitian
                                </span>
                                <span className="text-[11px] font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    Litabmas PTMA Terintegrasi
                                </span>
                            </div>
                        </div>

                        {/* Middle Links */}
                        <div className="hidden md:flex md:items-center md:gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
                            <a href="#statistik" className="transition-colors hover:text-blue-900 dark:hover:text-blue-400">
                                Statistik
                            </a>
                            <a href="#skema-riset" className="transition-colors hover:text-blue-900 dark:hover:text-blue-400">
                                Skema Riset
                            </a>
                            <a href="#pilar-tata-kelola" className="transition-colors hover:text-blue-900 dark:hover:text-blue-400">
                                Tata Kelola
                            </a>
                            <Link
                                href={route('design-system-preview')}
                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                <Layers className="h-3.5 w-3.5 text-blue-900 dark:text-blue-400" />
                                Katalog Sistem Desain
                            </Link>
                        </div>

                        {/* Auth Navigation */}
                        <div className="flex items-center gap-3">
                            {auth?.user ? (
                                <Link href={route('dashboard')}>
                                    <Button className="h-9 gap-2 rounded-lg bg-blue-900 px-4 text-xs font-semibold text-white shadow hover:bg-blue-800">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span>Buka Dashboard</span>
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')}>
                                        <Button
                                            variant="ghost"
                                            className="h-9 rounded-lg px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Masuk
                                        </Button>
                                    </Link>
                                    <Link href={route('register')}>
                                        <Button className="h-9 rounded-lg bg-blue-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-800">
                                            Daftar
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* HERO SECTION */}
                <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24 dark:border-slate-800 dark:bg-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.06),transparent_50%)]"></div>
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
                                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Platform Penelitian Terintegrasi Standalone (RPL-2026)</span>
                            </div>

                            <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                                Tata Kelola Riset Akademik dan Monev Multi-Kampus PTMA
                            </h1>

                            <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                                Sistem manajemen siklus riset mandiri: mulai dari pengusulan proposal terisolasi per institusi, penilaian
                                independen berstandar akreditasi, pencairan dana berbasis gerbang Monev, hingga validasi luaran ilmiah nasional.
                            </p>

                            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                <Link href={auth?.user ? route('dashboard') : route('login')}>
                                    <Button className="h-11 gap-2 rounded-lg bg-blue-900 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">
                                        <span>{auth?.user ? 'Buka Dashboard Riset' : 'Masuk ke SIM-Penelitian'}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>

                                <Link href={route('design-system-preview')}>
                                    <Button
                                        variant="outline"
                                        className="h-11 gap-2 rounded-lg border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <Layers className="h-4 w-4 text-blue-900 dark:text-blue-400" />
                                        <span>Lihat Sistem Desain Internal</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* OVERALL METRICS SECTION (BENTO GRID) */}
                <section id="statistik" className="relative -mt-6 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Perguruan Tinggi Terintegrasi"
                            value={stats.totalUniversities || 0}
                            type="integer"
                            icon={<Building2 className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
                            badgeText="MULTI-TENANT"
                            badgeVariant="neutral"
                            caption="Institusi kampus Muhammadiyah aktif"
                        />
                        <MetricCard
                            title="Skema Riset Aktif"
                            value={stats.totalSchemas || 0}
                            type="integer"
                            icon={<BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                            badgeText="KOMPETITIF"
                            badgeVariant="success"
                            caption="Hibah penelitian terbuka untuk dosen"
                        />
                        <MetricCard
                            title="Usulan Proposal"
                            value={stats.totalProposals || 0}
                            type="integer"
                            icon={<FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                            badgeText="TERDAFTAR"
                            badgeVariant="warning"
                            caption="Proposal dalam siklus seleksi & monev"
                        />
                        <MetricCard
                            title="Luaran Terverifikasi"
                            value={stats.totalOutputs || 0}
                            type="integer"
                            icon={<Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                            badgeText="VALID"
                            badgeVariant="info"
                            caption="Jurnal, buku, HKI, dan produk prototipe"
                        />
                    </div>
                </section>

                {/* ACTIVE RESEARCH SCHEMES SECTION */}
                <section id="skema-riset" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                [SKEMA RISET TERBUKA]
                            </span>
                            <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Skema Pendanaan Penelitian
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Daftar skema riset aktif yang dibuka untuk dosen dan peneliti di lingkungan PTMA.
                            </p>
                        </div>

                        {/* Search Filter */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau deskripsi skema..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {filteredSchemes.length === 0 ? (
                        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                            <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
                            <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Belum ada skema riset aktif yang cocok
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Silakan hubungi LPPM kampus terkait untuk jadwal pembukaan periode hibah berikutnya.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSchemes.map((scheme) => {
                                const title = scheme.nama_skema || scheme.name || 'Skema Riset';
                                const description = scheme.deskripsi || scheme.description || 'Tidak ada deskripsi rinci.';
                                const funding = Number(scheme.biaya_maksimal || scheme.max_funding || 0);

                                return (
                                    <div
                                        key={scheme.id}
                                        className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <StatusBadge status="Approved" size="sm" />
                                                {scheme.university && (
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                        {scheme.university.code}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="mt-4 font-serif text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                                            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                                {description}
                                            </p>
                                        </div>

                                        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                        Plafon Maksimal
                                                    </span>
                                                    <div className="mt-0.5">
                                                        <TabularFigure value={funding} type="currency" className="text-base font-bold text-slate-900 dark:text-white" />
                                                    </div>
                                                </div>

                                                <Link href={auth?.user ? route('dashboard') : route('login')}>
                                                    <Button variant="outline" className="h-8 rounded-lg px-3 text-xs font-semibold text-blue-900 border-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-900">
                                                        Ajukan
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ARCHITECTURE PILLARS SECTION */}
                <section id="pilar-tata-kelola" className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <span className="text-xs font-semibold tracking-wider text-blue-900 uppercase dark:text-blue-400">
                                [INVARIAN ARSITEKTUR REKAYASA]
                            </span>
                            <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                4 Pilar Tata Kelola Riset Akademik Terintegrasi
                            </h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Dibangun berdasarkan rujukan baku RPL-2026 dan PRD Sistem Penelitian Terintegrasi Standalone.
                            </p>
                        </div>

                        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                                    Isolasi Multi-Tenancy
                                </h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Setiap transaksi dan data riset diisolasi ketat pada institusi terkait melalui kolom university_id dan TenantScope global Eloquent.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                                    Monev Gatekeeper Lock
                                </h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Pencairan dana Termin 2 (30%) diblokir secara absolut di level backend hingga laporan kemajuan Monev disetujui reviewer.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                                    Conflict of Interest Guard
                                </h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Penugasan reviewer menggagalkan plotting otomatis jika reviewer merupakan pengusul utama atau anggota tim usulan riset.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                                    Deduplikasi Luaran Ilmiah
                                </h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Validasi keunikan nomor registrasi kanonikal (DOI, ISBN, nomor registrasi HKI) per institusi untuk mencegah klaim ganda.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="border-t border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-serif text-sm font-bold text-slate-900 dark:text-white">
                                        SIM-Penelitian PTMA
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Majelis Pendidikan Tinggi Penelitian dan Pengembangan PP Muhammadiyah
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <Link href={route('login')} className="hover:text-blue-900 dark:hover:text-white">
                                    Masuk
                                </Link>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <Link href={route('register')} className="hover:text-blue-900 dark:hover:text-white">
                                    Registrasi
                                </Link>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <Link href={route('design-system-preview')} className="hover:text-blue-900 dark:hover:text-white">
                                    Sistem Desain
                                </Link>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-200/60 pt-6 text-center text-xs text-slate-400 dark:border-slate-800">
                            RPL-2026 Sistem Penelitian Terintegrasi Standalone. Bebas 100% dari Modul Legacy OJS/JurnalMu.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
