import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { BookMarked, BookOpen, Box, CheckCircle2, ExternalLink, Eye, Filter, Layers, Loader2, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import React, { useState } from 'react';

export interface UniversityOption {
    id: number;
    name: string;
    code?: string;
}

export interface OutputItemProps {
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
        university_id?: number;
        pengusul?: {
            id: number;
            name: string;
        };
        university?: {
            id: number;
            name: string;
            code?: string;
        };
    };
    journal_output?: {
        id: number;
        nama_jurnal: string;
        judul_artikel: string;
        issn?: string | null;
        indeksasi: string;
        status_publikasi: string;
        doi_url?: string | null;
        file_artikel_path?: string | null;
    } | null;
    journalOutput?: {
        id: number;
        nama_jurnal: string;
        judul_artikel: string;
        issn?: string | null;
        indeksasi: string;
        status_publikasi: string;
        doi_url?: string | null;
        file_artikel_path?: string | null;
    } | null;
    book_output?: {
        id: number;
        judul_buku: string;
        isbn: string;
        penerbit: string;
        tahun_terbit: number;
        jumlah_halaman?: number | null;
        file_cover_path?: string | null;
    } | null;
    bookOutput?: {
        id: number;
        judul_buku: string;
        isbn: string;
        penerbit: string;
        tahun_terbit: number;
        jumlah_halaman?: number | null;
        file_cover_path?: string | null;
    } | null;
    hki_output?: {
        id: number;
        judul_ciptaan: string;
        jenis_hki: string;
        nomor_pendaftaran?: string | null;
        nomor_sertifikat?: string | null;
        file_sertifikat_path?: string | null;
    } | null;
    hkiOutput?: {
        id: number;
        judul_ciptaan: string;
        jenis_hki: string;
        nomor_pendaftaran?: string | null;
        nomor_sertifikat?: string | null;
        file_sertifikat_path?: string | null;
    } | null;
    product_output?: {
        id: number;
        nama_produk: string;
        deskripsi_produk: string;
        tingkat_kesiapan_teknologi: number;
        dokumentasi_produk_path?: string | null;
    } | null;
    productOutput?: {
        id: number;
        nama_produk: string;
        deskripsi_produk: string;
        tingkat_kesiapan_teknologi: number;
        dokumentasi_produk_path?: string | null;
    } | null;
}

export interface VerifyProps {
    outputs: {
        data: OutputItemProps[];
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
    filters?: {
        status_verifikasi?: string;
        tipe_luaran?: string;
        university_id?: string | number;
    };
    universities?: UniversityOption[];
    kategoriOptions?: Record<string, string>;
    statusOptions?: Record<string, string>;
}

export default function Verify({ outputs, filters = {}, universities = [] }: VerifyProps) {
    const { t, locale } = useTranslation();

    const [statusFilter, setStatusFilter] = useState(filters.status_verifikasi || 'all');
    const [clusterFilter, setClusterFilter] = useState(filters.tipe_luaran || 'all');
    const [universityFilter, setUniversityFilter] = useState(filters.university_id ? String(filters.university_id) : 'all');

    const [verifyingOutput, setVerifyingOutput] = useState<OutputItemProps | null>(null);
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
    const [previewDocTitle, setPreviewDocTitle] = useState<string>('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: route('dashboard') },
        { title: t.output.verifyTitle, href: route('admin.outputs.index') },
    ];

    // Verification Form State
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        status_verifikasi: 'Verified' | 'Rejected';
        catatan_verifikasi: string;
    }>({
        status_verifikasi: 'Verified',
        catatan_verifikasi: '',
    });

    const [formValidationError, setFormValidationError] = useState<string | null>(null);

    const handleApplyFilters = () => {
        router.get(
            route('admin.outputs.index'),
            {
                status_verifikasi: statusFilter === 'all' ? '' : statusFilter,
                tipe_luaran: clusterFilter === 'all' ? '' : clusterFilter,
                university_id: universityFilter === 'all' ? '' : universityFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResetFilters = () => {
        setStatusFilter('all');
        setClusterFilter('all');
        setUniversityFilter('all');
        router.get(route('admin.outputs.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const openVerifyModal = (output: OutputItemProps) => {
        setVerifyingOutput(output);
        setFormValidationError(null);
        clearErrors();
        setData({
            status_verifikasi: 'Verified',
            catatan_verifikasi: output.catatan_verifikasi || '',
        });
    };

    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormValidationError(null);

        if (data.status_verifikasi === 'Rejected' && !data.catatan_verifikasi.trim()) {
            setFormValidationError(t.output.notesValidation);
            return;
        }

        if (!verifyingOutput) return;

        post(route('admin.outputs.verify', verifyingOutput.id), {
            preserveScroll: true,
            onSuccess: () => {
                setVerifyingOutput(null);
                reset();
            },
        });
    };

    const getFilePath = (output: OutputItemProps): string | null => {
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

    const handleOpenPreview = (output: OutputItemProps) => {
        const filePath = getFilePath(output);
        const url = getFileUrl(filePath);
        if (!url) return;

        const title =
            output.journal_output?.judul_artikel ||
            output.journalOutput?.judul_artikel ||
            output.book_output?.judul_buku ||
            output.bookOutput?.judul_buku ||
            output.hki_output?.judul_ciptaan ||
            output.hkiOutput?.judul_ciptaan ||
            output.product_output?.nama_produk ||
            output.productOutput?.nama_produk ||
            `Output #${output.id}`;

        setPreviewDocUrl(url);
        setPreviewDocTitle(title);
    };

    const dataList = outputs?.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.output.verifyTitle} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <PageHeader title={t.output.verifyTitle} subtitle={t.output.verifySubtitle} isEditorialSerif />

                {/* Filter Toolbar */}
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Status Filter */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold tracking-wider text-slate-700 uppercase">{t.output.filterStatus}</Label>
                            <Select
                                value={statusFilter}
                                onValueChange={(val) => {
                                    setStatusFilter(val);
                                }}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder={t.output.allStatuses} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.output.allStatuses}</SelectItem>
                                    <SelectItem value="Submitted">{t.output.submitted}</SelectItem>
                                    <SelectItem value="Verified">{t.output.verified}</SelectItem>
                                    <SelectItem value="Rejected">{t.output.rejected}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cluster Filter */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold tracking-wider text-slate-700 uppercase">{t.output.filterCluster}</Label>
                            <Select
                                value={clusterFilter}
                                onValueChange={(val) => {
                                    setClusterFilter(val);
                                }}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder={t.output.allClusters} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.output.allClusters}</SelectItem>
                                    <SelectItem value="Journal">{t.output.journalShort}</SelectItem>
                                    <SelectItem value="Book">{t.output.bookShort}</SelectItem>
                                    <SelectItem value="Hki">{t.output.hkiShort}</SelectItem>
                                    <SelectItem value="Product">{t.output.productShort}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* University Filter (Super Admin) */}
                        {universities.length > 0 && (
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold tracking-wider text-slate-700 uppercase">{t.output.filterUniversity}</Label>
                                <Select
                                    value={universityFilter}
                                    onValueChange={(val) => {
                                        setUniversityFilter(val);
                                    }}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder={t.output.allUniversities} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t.output.allUniversities}</SelectItem>
                                        {universities.map((univ) => (
                                            <SelectItem key={univ.id} value={String(univ.id)}>
                                                {univ.code ? `[${univ.code}] ` : ''}
                                                {univ.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Filter Buttons */}
                        <div className="flex items-end gap-2">
                            <Button type="button" onClick={handleApplyFilters} className="flex-1 bg-blue-900 text-white hover:bg-blue-800">
                                <Filter className="mr-1.5 h-3.5 w-3.5" />
                                {t.common.filter}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResetFilters}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50"
                                title={t.common.reset}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Output Verification Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-3.5">
                                        {t.output.proposal}
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        {t.output.lecturer}
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
                                    <th scope="col" className="px-6 py-3.5 text-right">
                                        {t.output.actions}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {dataList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            <div className="mx-auto max-w-sm space-y-2">
                                                <Layers className="mx-auto h-8 w-8 text-slate-400" />
                                                <p className="font-serif text-sm font-semibold text-slate-800">{t.output.empty}</p>
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

                                        return (
                                            <tr key={output.id} className="transition-colors hover:bg-slate-50/50">
                                                {/* Proposal & University */}
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs space-y-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            {output.proposal?.university?.code && (
                                                                <span className="py-0.2 rounded-sm bg-slate-100 px-1 font-mono text-[10px] font-bold text-slate-700">
                                                                    [{output.proposal.university.code}]
                                                                </span>
                                                            )}
                                                            <span className="font-mono text-xs font-semibold text-slate-400">
                                                                #{output.id_proposal}
                                                            </span>
                                                        </div>
                                                        <p className="line-clamp-2 font-serif text-sm font-medium text-slate-900">
                                                            {output.proposal?.judul ?? '-'}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Lecturer */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-medium text-slate-800">{output.proposal?.pengusul?.name ?? '-'}</span>
                                                </td>

                                                {/* Cluster Badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {output.tipe_luaran === 'Journal' && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                                                            <BookOpen className="h-3.5 w-3.5" />
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
                                                                    <span className="font-medium text-slate-800">{journal.indeksasi}</span>
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

                                                        {output.catatan_verifikasi && (
                                                            <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                                                                <span className="font-semibold">{t.output.verificationNotes}:</span>{' '}
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

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {fileUrl && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenPreview(output)}
                                                                className="border-slate-200 text-slate-700 hover:bg-slate-50"
                                                                title={t.output.previewDoc}
                                                            >
                                                                <Eye className="mr-1 h-3.5 w-3.5" />
                                                                <span className="hidden sm:inline">{t.output.previewDoc}</span>
                                                            </Button>
                                                        )}

                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => openVerifyModal(output)}
                                                            className="bg-blue-900 text-white hover:bg-blue-800"
                                                        >
                                                            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                                            {t.output.verify}
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

            {/* Document Preview Modal */}
            <Dialog open={Boolean(previewDocUrl)} onOpenChange={(open) => !open && setPreviewDocUrl(null)}>
                <DialogContent className="max-h-[95vh] max-w-4xl p-4 sm:rounded-xl">
                    <DialogHeader className="border-b border-slate-200 pb-3">
                        <DialogTitle className="font-serif text-lg font-bold text-slate-900">{previewDocTitle}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            {previewDocUrl && (
                                <a
                                    href={previewDocUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-900 hover:underline"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    {t.output.downloadPdf}
                                </a>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="h-[70vh] w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                        {previewDocUrl && <iframe src={previewDocUrl} title={previewDocTitle} className="h-full w-full" />}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPreviewDocUrl(null)}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                            {t.output.closePreview}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Verification Action Modal */}
            <Dialog open={Boolean(verifyingOutput)} onOpenChange={(open) => !open && setVerifyingOutput(null)}>
                <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto bg-white p-6 shadow-xl sm:rounded-xl">
                    <DialogHeader className="border-b border-slate-200 pb-3">
                        <DialogTitle className="font-serif text-xl font-bold tracking-tight text-slate-900">{t.output.verifyModalTitle}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-600">{t.output.verifyModalDesc}</DialogDescription>
                    </DialogHeader>

                    {verifyingOutput && (
                        <form onSubmit={handleVerifySubmit} className="space-y-5 pt-3">
                            {/* Summary Box */}
                            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                                <p className="font-semibold text-slate-800">{verifyingOutput.proposal?.judul}</p>
                                <p className="text-slate-600">
                                    {t.output.lecturer}:{' '}
                                    <span className="font-medium text-slate-900">{verifyingOutput.proposal?.pengusul?.name}</span> •{' '}
                                    {t.output.cluster}: <span className="font-semibold text-slate-900">{verifyingOutput.tipe_luaran}</span>
                                </p>
                            </div>

                            {/* Decision Choice */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                    {t.output.status} <span className="text-rose-600">*</span>
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('status_verifikasi', 'Verified');
                                            setFormValidationError(null);
                                        }}
                                        className={`flex items-center justify-between rounded-lg border p-3.5 text-left transition-all ${
                                            data.status_verifikasi === 'Verified'
                                                ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <div>
                                            <span className="block text-sm font-bold text-emerald-900">{t.output.approveAction}</span>
                                            <span className="text-xs text-emerald-700">{t.output.verified}</span>
                                        </div>
                                        <CheckCircle2
                                            className={`h-5 w-5 ${data.status_verifikasi === 'Verified' ? 'text-emerald-700' : 'text-slate-400'}`}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData('status_verifikasi', 'Rejected');
                                        }}
                                        className={`flex items-center justify-between rounded-lg border p-3.5 text-left transition-all ${
                                            data.status_verifikasi === 'Rejected'
                                                ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-1 ring-rose-600'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <div>
                                            <span className="block text-sm font-bold text-rose-900">{t.output.rejectAction}</span>
                                            <span className="text-xs text-rose-700">{t.output.rejected}</span>
                                        </div>
                                        <XCircle
                                            className={`h-5 w-5 ${data.status_verifikasi === 'Rejected' ? 'text-rose-700' : 'text-slate-400'}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Approve confirmation or Rejection notes */}
                            {data.status_verifikasi === 'Verified' ? (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900">
                                    <p className="font-medium">{t.output.approveConfirmDesc}</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label htmlFor="catatan_verifikasi" className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.output.rejectNotesLabel} <span className="text-rose-600">*</span>
                                    </Label>
                                    <Textarea
                                        id="catatan_verifikasi"
                                        rows={4}
                                        value={data.catatan_verifikasi}
                                        onChange={(e) => {
                                            setData('catatan_verifikasi', e.target.value);
                                            setFormValidationError(null);
                                        }}
                                        placeholder={t.output.rejectNotesPlaceholder}
                                        className="bg-white text-sm"
                                    />
                                    {formValidationError && <p className="text-xs font-semibold text-rose-600">{formValidationError}</p>}
                                    {errors.catatan_verifikasi && <p className="text-xs font-semibold text-rose-600">{errors.catatan_verifikasi}</p>}
                                </div>
                            )}

                            {/* Modal Footer */}
                            <DialogFooter className="gap-2 border-t border-slate-200 pt-4 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setVerifyingOutput(null)}
                                    disabled={processing}
                                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                                >
                                    {t.output.cancel}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className={
                                        data.status_verifikasi === 'Verified'
                                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                            : 'bg-rose-700 text-white hover:bg-rose-800'
                                    }
                                >
                                    {processing ? (
                                        <span className="flex items-center gap-1.5">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t.output.submitting}
                                        </span>
                                    ) : data.status_verifikasi === 'Verified' ? (
                                        t.output.approveAction
                                    ) : (
                                        t.output.rejectAction
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
