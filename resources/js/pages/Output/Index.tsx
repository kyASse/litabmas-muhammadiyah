import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { BookMarked, Box, CheckCircle2, Clock, Download, ExternalLink, FileText, Layers, Lock, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateModal, { type ProposalOption } from './CreateModal';

export interface JournalOutputData {
    id: number;
    nama_jurnal: string;
    judul_artikel: string;
    issn?: string | null;
    indeksasi: string;
    status_publikasi: string;
    doi_url?: string | null;
    file_artikel_path?: string | null;
}

export interface BookOutputData {
    id: number;
    judul_buku: string;
    isbn: string;
    penerbit: string;
    tahun_terbit: number;
    jumlah_halaman?: number | null;
    file_cover_path?: string | null;
}

export interface HkiOutputData {
    id: number;
    judul_ciptaan: string;
    jenis_hki: string;
    nomor_pendaftaran?: string | null;
    nomor_sertifikat?: string | null;
    file_sertifikat_path?: string | null;
}

export interface ProductOutputData {
    id: number;
    nama_produk: string;
    deskripsi_produk: string;
    tingkat_kesiapan_teknologi: number;
    dokumentasi_produk_path?: string | null;
}

export interface ResearchOutputItem {
    id: number;
    id_proposal: number;
    tipe_luaran: 'Journal' | 'Book' | 'Hki' | 'Product';
    target_status: 'Wajib' | 'Tambahan';
    status_verifikasi: 'Draft' | 'Submitted' | 'Verified' | 'Rejected' | string;
    catatan_verifikasi?: string | null;
    tanggal_pelaporan?: string | null;
    created_at?: string;
    proposal?: {
        id: number;
        judul: string;
        status_proposal?: string;
        status_penelitian?: string;
        university_id?: number;
        pengusul?: {
            id: number;
            name: string;
        };
    };
    journal_output?: JournalOutputData | null;
    journalOutput?: JournalOutputData | null;
    book_output?: BookOutputData | null;
    bookOutput?: BookOutputData | null;
    hki_output?: HkiOutputData | null;
    hkiOutput?: HkiOutputData | null;
    product_output?: ProductOutputData | null;
    productOutput?: ProductOutputData | null;
}

export interface IndexProps {
    outputs: {
        data: ResearchOutputItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    proposals?: ProposalOption[];
}

export default function Index({ outputs, proposals = [] }: IndexProps) {
    const { t, locale } = useTranslation();
    const [createModalOpen, setCreateModalOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search).get('create') === '1';
        }
        return false;
    });
    const [outputToDelete, setOutputToDelete] = useState<ResearchOutputItem | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: route('dashboard') },
        { title: t.navigation.outputs, href: route('outputs.index') },
    ];

    const dataList = outputs?.data ?? [];

    // Calculate quick metrics
    const totalCount = outputs?.total ?? dataList.length;
    const mandatoryVerifiedCount = dataList.filter((o) => o.target_status === 'Wajib' && o.status_verifikasi === 'Verified').length;
    const additionalCount = dataList.filter((o) => o.target_status === 'Tambahan').length;
    const pendingCount = dataList.filter((o) => o.status_verifikasi === 'Submitted').length;

    const handleDelete = () => {
        if (!outputToDelete) return;
        router.delete(route('outputs.destroy', outputToDelete.id), {
            preserveScroll: true,
            onFinish: () => setOutputToDelete(null),
        });
    };

    const getFilePath = (output: ResearchOutputItem): string | null => {
        const j = output.journal_output ?? output.journalOutput;
        if (j?.file_artikel_path) return j.file_artikel_path;

        const b = output.book_output ?? output.bookOutput;
        if (b?.file_cover_path) return b.file_cover_path;

        const h = output.hki_output ?? output.hkiOutput;
        if (h?.file_sertifikat_path) return h.file_sertifikat_path;

        const p = output.product_output ?? output.productOutput;
        if (p?.dokumentasi_produk_path) return p.dokumentasi_produk_path;

        return null;
    };

    const getFileUrl = (filePath: string | null): string | null => {
        if (!filePath) return null;
        if (filePath.startsWith('http')) return filePath;
        return `/storage/${filePath.replace(/^\/+/, '')}`;
    };

    const isLocked = (output: ResearchOutputItem): boolean => {
        const isSelesai = output.proposal?.status_penelitian === 'Selesai' || output.proposal?.status_proposal === 'Selesai';
        const isVerified = output.status_verifikasi === 'Verified';
        return Boolean(isSelesai || isVerified);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.output.title} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <PageHeader
                    title={t.output.title}
                    subtitle={t.output.pageSubtitle}
                    isEditorialSerif={false}
                    actions={
                        <Button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-900 text-white hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            {t.output.create}
                        </Button>
                    }
                />

                {/* Metric Summary Cards */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title={t.output.statsTotal}
                        value={totalCount}
                        type="integer"
                        icon={Layers}
                        iconBgClass="bg-slate-100"
                        iconColorClass="text-slate-800"
                        badgeText={t.output.cluster}
                        badgeVariant="neutral"
                    />
                    <MetricCard
                        title={t.output.statsMandatoryVerified}
                        value={mandatoryVerifiedCount}
                        type="integer"
                        icon={CheckCircle2}
                        iconBgClass="bg-emerald-50"
                        iconColorClass="text-emerald-700"
                        badgeText={t.output.mandatoryBadge}
                        badgeVariant="success"
                    />
                    <MetricCard
                        title={t.output.statsAdditional}
                        value={additionalCount}
                        type="integer"
                        icon={BookMarked}
                        iconBgClass="bg-blue-50"
                        iconColorClass="text-blue-900"
                        badgeText={t.output.additionalBadge}
                        badgeVariant="neutral"
                    />
                    <MetricCard
                        title={t.output.statsPending}
                        value={pendingCount}
                        type="integer"
                        icon={Clock}
                        iconBgClass="bg-amber-50"
                        iconColorClass="text-amber-700"
                        badgeText={t.output.submitted}
                        badgeVariant="warning"
                    />
                </div>

                {/* Outputs List Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-3.5">
                                        {t.output.proposal}
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        {t.output.cluster}
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        {t.output.canonicalId}
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        {t.output.targetStatus}
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        {t.output.status}
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        {t.output.reportedDate}
                                    </th>
                                    <th scope="col" className="px-6 py-3.5 text-right">
                                        {t.output.actions}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {dataList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="mx-auto max-w-sm space-y-3">
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                                <h3 className="font-serif text-base font-semibold text-slate-800">{t.output.empty}</h3>
                                                <p className="text-xs text-slate-500">{t.output.emptySub}</p>
                                                <Button
                                                    type="button"
                                                    onClick={() => setCreateModalOpen(true)}
                                                    variant="outline"
                                                    className="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Plus className="mr-1.5 h-4 w-4" />
                                                    {t.output.create}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    dataList.map((output) => {
                                        const journal = output.journal_output ?? output.journalOutput;
                                        const book = output.book_output ?? output.bookOutput;
                                        const hki = output.hki_output ?? output.hkiOutput;
                                        const product = output.product_output ?? output.productOutput;
                                        const filePath = getFilePath(output);
                                        const fileUrl = getFileUrl(filePath);
                                        const locked = isLocked(output);

                                        return (
                                            <tr key={output.id} className="transition-colors hover:bg-slate-50/50">
                                                {/* Proposal */}
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs space-y-0.5">
                                                        <span className="font-mono text-xs font-semibold text-slate-400">#{output.id_proposal}</span>
                                                        <p className="line-clamp-2 font-serif text-sm font-medium text-slate-900">
                                                            {output.proposal?.judul ?? '-'}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Cluster Badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {output.tipe_luaran === 'Journal' && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                                                            <FileText className="h-3.5 w-3.5" />
                                                            {t.output.journalShort}
                                                        </span>
                                                    )}
                                                    {output.tipe_luaran === 'Book' && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800">
                                                            <BookMarked className="h-3.5 w-3.5" />
                                                            {t.output.bookShort}
                                                        </span>
                                                    )}
                                                    {output.tipe_luaran === 'Hki' && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                                            <ShieldCheck className="h-3.5 w-3.5" />
                                                            {t.output.hkiShort}
                                                        </span>
                                                    )}
                                                    {output.tipe_luaran === 'Product' && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                                            <Box className="h-3.5 w-3.5" />
                                                            {t.output.productShort}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Canonical Title & Identifier */}
                                                <td className="px-6 py-4">
                                                    <div className="max-w-md space-y-1">
                                                        {output.tipe_luaran === 'Journal' && journal && (
                                                            <>
                                                                <p className="font-serif text-sm font-semibold text-slate-900">
                                                                    {journal.judul_artikel}
                                                                </p>
                                                                <p className="text-xs text-slate-600">
                                                                    {journal.nama_jurnal} |{' '}
                                                                    <span className="font-medium text-slate-800">{journal.indeksasi}</span> (
                                                                    {journal.status_publikasi})
                                                                </p>
                                                                {journal.doi_url && (
                                                                    <a
                                                                        href={
                                                                            journal.doi_url.startsWith('http')
                                                                                ? journal.doi_url
                                                                                : `https://doi.org/${journal.doi_url}`
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 font-mono text-xs text-blue-900 hover:underline"
                                                                    >
                                                                        <span className="font-semibold">DOI:</span> {journal.doi_url}
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                            </>
                                                        )}

                                                        {output.tipe_luaran === 'Book' && book && (
                                                            <>
                                                                <p className="font-serif text-sm font-semibold text-slate-900">{book.judul_buku}</p>
                                                                <p className="text-xs text-slate-600">
                                                                    {book.penerbit} ({book.tahun_terbit})
                                                                    {book.jumlah_halaman ? ` • ${book.jumlah_halaman} hlm` : ''}
                                                                </p>
                                                                <p className="font-mono text-xs text-slate-700">
                                                                    <span className="font-semibold text-slate-500">ISBN:</span> {book.isbn}
                                                                </p>
                                                            </>
                                                        )}

                                                        {output.tipe_luaran === 'Hki' && hki && (
                                                            <>
                                                                <p className="font-serif text-sm font-semibold text-slate-900">{hki.judul_ciptaan}</p>
                                                                <p className="text-xs text-slate-600">{hki.jenis_hki.replace(/_/g, ' ')}</p>
                                                                <div className="flex flex-wrap gap-2 font-mono text-xs text-slate-700">
                                                                    {hki.nomor_pendaftaran && (
                                                                        <span>
                                                                            <span className="text-slate-500">Reg:</span> {hki.nomor_pendaftaran}
                                                                        </span>
                                                                    )}
                                                                    {hki.nomor_sertifikat && (
                                                                        <span>
                                                                            <span className="text-slate-500">Sert:</span> {hki.nomor_sertifikat}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}

                                                        {output.tipe_luaran === 'Product' && product && (
                                                            <>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-serif text-sm font-semibold text-slate-900">
                                                                        {product.nama_produk}
                                                                    </p>
                                                                    <span className="inline-flex rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-800">
                                                                        TKT {product.tingkat_kesiapan_teknologi}
                                                                    </span>
                                                                </div>
                                                                <p className="line-clamp-2 text-xs text-slate-600">{product.deskripsi_produk}</p>
                                                            </>
                                                        )}

                                                        {output.status_verifikasi === 'Rejected' && output.catatan_verifikasi && (
                                                            <div className="mt-1.5 rounded-md border border-rose-200 bg-rose-50/70 p-2 text-xs text-rose-800">
                                                                <span className="font-bold">{t.output.verificationNotes}:</span>{' '}
                                                                {output.catatan_verifikasi}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Target Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {output.target_status === 'Wajib' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                                            {t.output.mandatoryBadge}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                                            {t.output.additionalBadge}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Verification Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={output.status_verifikasi} size="sm" />
                                                </td>

                                                {/* Reported Date */}
                                                <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-slate-500">
                                                    {output.tanggal_pelaporan
                                                        ? new Date(output.tanggal_pelaporan).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric',
                                                          })
                                                        : '-'}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {fileUrl ? (
                                                            <a
                                                                href={fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                                                title={t.output.downloadPdf}
                                                            >
                                                                <Download className="h-3.5 w-3.5" />
                                                                <span className="hidden sm:inline">{t.output.downloadPdf}</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">{t.output.noDocument}</span>
                                                        )}

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={locked}
                                                            onClick={() => setOutputToDelete(output)}
                                                            className={`p-1.5 ${
                                                                locked
                                                                    ? 'cursor-not-allowed text-slate-300'
                                                                    : 'text-rose-600 hover:bg-rose-50 hover:text-rose-800'
                                                            }`}
                                                            title={locked ? t.output.readOnlyLock : t.output.delete}
                                                        >
                                                            {locked ? <Lock className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {outputs.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
                            <div>
                                <span>
                                    Page {outputs.current_page} of {outputs.last_page} ({outputs.total} total)
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {outputs.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        className={`rounded-md px-3 py-1 font-medium transition-colors ${
                                            link.active
                                                ? 'bg-blue-900 text-white'
                                                : link.url
                                                  ? 'text-slate-700 hover:bg-slate-200'
                                                  : 'cursor-not-allowed text-slate-400'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Output Modal */}
            <CreateModal open={createModalOpen} onOpenChange={setCreateModalOpen} proposals={proposals} />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={Boolean(outputToDelete)} onOpenChange={(open) => !open && setOutputToDelete(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif text-lg font-bold text-slate-900">{t.output.delete}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-600">{t.output.deleteConfirm}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-300 text-slate-700">{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-600 text-white hover:bg-rose-700">
                            {t.output.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
