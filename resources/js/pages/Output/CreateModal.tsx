import React from 'react';
import { useForm } from '@inertiajs/react';
import { BookMarked, BookOpen, Box, Cpu, FileCheck2, Loader2, ShieldCheck, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PDFUploader } from '@/components/ui/PDFUploader';

export interface ProposalOption {
    id: number;
    judul?: string;
    judul_penelitian?: string;
    status_proposal?: string;
}

export interface CreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proposals?: ProposalOption[];
    initialProposalId?: number;
    onSuccess?: () => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({
    open,
    onOpenChange,
    proposals = [],
    initialProposalId,
    onSuccess,
}) => {
    const { t } = useTranslation();

    const defaultProposalId =
        initialProposalId ?? (proposals.length > 0 ? proposals[0].id : '');

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        id_proposal: string | number;
        tipe_luaran: 'Journal' | 'Book' | 'Hki' | 'Product';
        target_status: 'Wajib' | 'Tambahan';
        file_dokumen: File | null;
        // Journal fields
        nama_jurnal: string;
        judul_artikel: string;
        issn: string;
        indeksasi: string;
        status_publikasi: string;
        doi_url: string;
        // Book fields
        judul_buku: string;
        isbn: string;
        penerbit: string;
        tahun_terbit: string | number;
        jumlah_halaman: string | number;
        // Hki fields
        judul_ciptaan: string;
        jenis_hki: string;
        nomor_pendaftaran: string;
        nomor_sertifikat: string;
        // Product fields
        nama_produk: string;
        deskripsi_produk: string;
        tingkat_kesiapan_teknologi: string | number;
    }>({
        id_proposal: defaultProposalId,
        tipe_luaran: 'Journal',
        target_status: 'Wajib',
        file_dokumen: null,
        nama_jurnal: '',
        judul_artikel: '',
        issn: '',
        indeksasi: 'Scopus',
        status_publikasi: 'Published',
        doi_url: '',
        judul_buku: '',
        isbn: '',
        penerbit: '',
        tahun_terbit: new Date().getFullYear(),
        jumlah_halaman: '',
        judul_ciptaan: '',
        jenis_hki: 'Hak_Cipta',
        nomor_pendaftaran: '',
        nomor_sertifikat: '',
        nama_produk: '',
        deskripsi_produk: '',
        tingkat_kesiapan_teknologi: 3,
    });

    React.useEffect(() => {
        if (initialProposalId) {
            setData('id_proposal', initialProposalId);
        } else if (proposals.length > 0 && !data.id_proposal) {
            setData('id_proposal', proposals[0].id);
        }
    }, [initialProposalId, proposals]);

    const handleClusterChange = (value: string) => {
        setData('tipe_luaran', value as 'Journal' | 'Book' | 'Hki' | 'Product');
        clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('outputs.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
                onSuccess?.();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto bg-white p-6 shadow-xl sm:rounded-xl">
                <DialogHeader className="border-b border-slate-200 pb-4">
                    <DialogTitle className="font-serif text-2xl font-bold tracking-tight text-slate-900">
                        {t.output.modalTitle}
                    </DialogTitle>
                    <DialogDescription className="font-sans text-sm text-slate-600">
                        {t.output.modalSubtitle}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    {/* Proposal Selection */}
                    <div className="space-y-1.5">
                        <Label htmlFor="id_proposal" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            {t.output.proposal} <span className="text-rose-600">*</span>
                        </Label>
                        {proposals.length > 0 ? (
                            <Select
                                value={String(data.id_proposal)}
                                onValueChange={(val) => setData('id_proposal', Number(val))}
                            >
                                <SelectTrigger id="id_proposal" className="w-full bg-white text-slate-800">
                                    <SelectValue placeholder={t.output.selectProposalPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {proposals.map((prop) => (
                                        <SelectItem key={prop.id} value={String(prop.id)}>
                                            <span className="font-medium text-slate-900">#{prop.id}</span> - {prop.judul || prop.judul_penelitian}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                id="id_proposal"
                                type="number"
                                value={data.id_proposal}
                                onChange={(e) => setData('id_proposal', e.target.value)}
                                placeholder="Proposal ID"
                                className="bg-white"
                            />
                        )}
                        {errors.id_proposal && (
                            <p className="text-xs font-medium text-rose-600">{errors.id_proposal}</p>
                        )}
                    </div>

                    {/* Target Status (Wajib vs Tambahan) */}
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            {t.output.targetStatus} <span className="text-rose-600">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setData('target_status', 'Wajib')}
                                className={`flex items-center justify-between rounded-md border p-3 text-left transition-all ${
                                    data.target_status === 'Wajib'
                                        ? 'border-blue-900 bg-white shadow-xs ring-1 ring-blue-900'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <span className="block text-sm font-semibold text-slate-900">
                                        {t.output.mandatory}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {t.output.mandatoryBadge}
                                    </span>
                                </div>
                                <FileCheck2
                                    className={`h-5 w-5 ${
                                        data.target_status === 'Wajib' ? 'text-blue-900' : 'text-slate-400'
                                    }`}
                                />
                            </button>

                            <button
                                type="button"
                                onClick={() => setData('target_status', 'Tambahan')}
                                className={`flex items-center justify-between rounded-md border p-3 text-left transition-all ${
                                    data.target_status === 'Tambahan'
                                        ? 'border-blue-900 bg-white shadow-xs ring-1 ring-blue-900'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <span className="block text-sm font-semibold text-slate-900">
                                        {t.output.additional}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {t.output.additionalBadge}
                                    </span>
                                </div>
                                <FileCheck2
                                    className={`h-5 w-5 ${
                                        data.target_status === 'Tambahan' ? 'text-blue-900' : 'text-slate-400'
                                    }`}
                                />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">{t.output.targetHelper}</p>
                        {errors.target_status && (
                            <p className="text-xs font-medium text-rose-600">{errors.target_status}</p>
                        )}
                    </div>

                    {/* Cluster Tabs Switcher */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            {t.output.cluster} <span className="text-rose-600">*</span>
                        </Label>
                        <Tabs
                            value={data.tipe_luaran}
                            onValueChange={handleClusterChange}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
                                <TabsTrigger
                                    value="Journal"
                                    className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-950"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t.output.journalShort}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="Book"
                                    className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-950"
                                >
                                    <BookMarked className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t.output.bookShort}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="Hki"
                                    className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-950"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t.output.hkiShort}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="Product"
                                    className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-950"
                                >
                                    <Box className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t.output.productShort}</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Journal Tab */}
                            <TabsContent value="Journal" className="space-y-4 pt-3">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label htmlFor="judul_artikel" className="text-xs font-medium text-slate-700">
                                            {t.output.articleTitle} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="judul_artikel"
                                            value={data.judul_artikel}
                                            onChange={(e) => setData('judul_artikel', e.target.value)}
                                            placeholder={t.output.articleTitlePlaceholder}
                                            className="bg-white"
                                        />
                                        {errors.judul_artikel && (
                                            <p className="text-xs text-rose-600">{errors.judul_artikel}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <Label htmlFor="nama_jurnal" className="text-xs font-medium text-slate-700">
                                            {t.output.journalName} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="nama_jurnal"
                                            value={data.nama_jurnal}
                                            onChange={(e) => setData('nama_jurnal', e.target.value)}
                                            placeholder={t.output.journalNamePlaceholder}
                                            className="bg-white"
                                        />
                                        {errors.nama_jurnal && (
                                            <p className="text-xs text-rose-600">{errors.nama_jurnal}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="issn" className="text-xs font-medium text-slate-700">
                                            {t.output.issn}
                                        </Label>
                                        <Input
                                            id="issn"
                                            value={data.issn}
                                            onChange={(e) => setData('issn', e.target.value)}
                                            placeholder={t.output.issnPlaceholder}
                                            className="bg-white font-mono"
                                        />
                                        {errors.issn && (
                                            <p className="text-xs text-rose-600">{errors.issn}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="indeksasi" className="text-xs font-medium text-slate-700">
                                            {t.output.indexation} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Select
                                            value={data.indeksasi}
                                            onValueChange={(val) => setData('indeksasi', val)}
                                        >
                                            <SelectTrigger id="indeksasi" className="bg-white">
                                                <SelectValue placeholder={t.output.indexationPlaceholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Scopus">Scopus</SelectItem>
                                                <SelectItem value="Sinta_1">Sinta 1</SelectItem>
                                                <SelectItem value="Sinta_2">Sinta 2</SelectItem>
                                                <SelectItem value="Sinta_3">Sinta 3</SelectItem>
                                                <SelectItem value="Sinta_4">Sinta 4</SelectItem>
                                                <SelectItem value="Internasional">Internasional</SelectItem>
                                                <SelectItem value="Nasional">Nasional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.indeksasi && (
                                            <p className="text-xs text-rose-600">{errors.indeksasi}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="status_publikasi" className="text-xs font-medium text-slate-700">
                                            {t.output.pubStatus} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Select
                                            value={data.status_publikasi}
                                            onValueChange={(val) => setData('status_publikasi', val)}
                                        >
                                            <SelectTrigger id="status_publikasi" className="bg-white">
                                                <SelectValue placeholder={t.output.pubStatusPlaceholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Published">Published</SelectItem>
                                                <SelectItem value="Accepted">Accepted</SelectItem>
                                                <SelectItem value="Submitted">Submitted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status_publikasi && (
                                            <p className="text-xs text-rose-600">{errors.status_publikasi}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="doi_url" className="text-xs font-medium text-slate-700">
                                            {t.output.doi}
                                        </Label>
                                        <Input
                                            id="doi_url"
                                            value={data.doi_url}
                                            onChange={(e) => setData('doi_url', e.target.value)}
                                            placeholder={t.output.doiPlaceholder}
                                            className="bg-white font-mono"
                                        />
                                        <p className="text-[11px] text-slate-500">{t.output.doiHelp}</p>
                                        {errors.doi_url && (
                                            <p className="text-xs font-medium text-rose-600">{errors.doi_url}</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Book Tab */}
                            <TabsContent value="Book" className="space-y-4 pt-3">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label htmlFor="judul_buku" className="text-xs font-medium text-slate-700">
                                            {t.output.bookTitle} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="judul_buku"
                                            value={data.judul_buku}
                                            onChange={(e) => setData('judul_buku', e.target.value)}
                                            placeholder={t.output.bookTitlePlaceholder}
                                            className="bg-white"
                                        />
                                        {errors.judul_buku && (
                                            <p className="text-xs text-rose-600">{errors.judul_buku}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="isbn" className="text-xs font-medium text-slate-700">
                                            {t.output.isbn} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="isbn"
                                            value={data.isbn}
                                            onChange={(e) => setData('isbn', e.target.value)}
                                            placeholder={t.output.isbnPlaceholder}
                                            className="bg-white font-mono"
                                        />
                                        <p className="text-[11px] text-slate-500">{t.output.isbnHelp}</p>
                                        {errors.isbn && (
                                            <p className="text-xs font-medium text-rose-600">{errors.isbn}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="penerbit" className="text-xs font-medium text-slate-700">
                                            {t.output.publisher} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="penerbit"
                                            value={data.penerbit}
                                            onChange={(e) => setData('penerbit', e.target.value)}
                                            placeholder={t.output.publisherPlaceholder}
                                            className="bg-white"
                                        />
                                        {errors.penerbit && (
                                            <p className="text-xs text-rose-600">{errors.penerbit}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="tahun_terbit" className="text-xs font-medium text-slate-700">
                                            {t.output.pubYear} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="tahun_terbit"
                                            type="number"
                                            value={data.tahun_terbit}
                                            onChange={(e) => setData('tahun_terbit', e.target.value)}
                                            className="bg-white font-mono"
                                        />
                                        {errors.tahun_terbit && (
                                            <p className="text-xs text-rose-600">{errors.tahun_terbit}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="jumlah_halaman" className="text-xs font-medium text-slate-700">
                                            {t.output.pageCount}
                                        </Label>
                                        <Input
                                            id="jumlah_halaman"
                                            type="number"
                                            value={data.jumlah_halaman}
                                            onChange={(e) => setData('jumlah_halaman', e.target.value)}
                                            placeholder="120"
                                            className="bg-white font-mono"
                                        />
                                        {errors.jumlah_halaman && (
                                            <p className="text-xs text-rose-600">{errors.jumlah_halaman}</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* HKI Tab */}
                            <TabsContent value="Hki" className="space-y-4 pt-3">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1 sm:col-span-2">
                                        <Label htmlFor="judul_ciptaan" className="text-xs font-medium text-slate-700">
                                            {t.output.creationTitle} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="judul_ciptaan"
                                            value={data.judul_ciptaan}
                                            onChange={(e) => setData('judul_ciptaan', e.target.value)}
                                            placeholder={t.output.creationTitlePlaceholder}
                                            className="bg-white"
                                        />
                                        {errors.judul_ciptaan && (
                                            <p className="text-xs text-rose-600">{errors.judul_ciptaan}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="jenis_hki" className="text-xs font-medium text-slate-700">
                                            {t.output.hkiType} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Select
                                            value={data.jenis_hki}
                                            onValueChange={(val) => setData('jenis_hki', val)}
                                        >
                                            <SelectTrigger id="jenis_hki" className="bg-white">
                                                <SelectValue placeholder={t.output.hkiTypePlaceholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Hak_Cipta">Hak Cipta</SelectItem>
                                                <SelectItem value="Paten">Paten</SelectItem>
                                                <SelectItem value="Desain_Industri">Desain Industri</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.jenis_hki && (
                                            <p className="text-xs text-rose-600">{errors.jenis_hki}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="nomor_pendaftaran" className="text-xs font-medium text-slate-700">
                                            {t.output.regNumber}
                                        </Label>
                                        <Input
                                            id="nomor_pendaftaran"
                                            value={data.nomor_pendaftaran}
                                            onChange={(e) => setData('nomor_pendaftaran', e.target.value)}
                                            placeholder={t.output.regNumberPlaceholder}
                                            className="bg-white font-mono"
                                        />
                                        <p className="text-[11px] text-slate-500">{t.output.regNumberHelp}</p>
                                        {errors.nomor_pendaftaran && (
                                            <p className="text-xs font-medium text-rose-600">{errors.nomor_pendaftaran}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <Label htmlFor="nomor_sertifikat" className="text-xs font-medium text-slate-700">
                                            {t.output.certNumber}
                                        </Label>
                                        <Input
                                            id="nomor_sertifikat"
                                            value={data.nomor_sertifikat}
                                            onChange={(e) => setData('nomor_sertifikat', e.target.value)}
                                            placeholder={t.output.certNumberPlaceholder}
                                            className="bg-white font-mono"
                                        />
                                        {errors.nomor_sertifikat && (
                                            <p className="text-xs text-rose-600">{errors.nomor_sertifikat}</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Product Tab */}
                            <TabsContent value="Product" className="space-y-4 pt-3">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="nama_produk" className="text-xs font-medium text-slate-700">
                                            {t.output.productName} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="nama_produk"
                                            value={data.nama_produk}
                                            onChange={(e) => setData('nama_produk', e.target.value)}
                                            placeholder={t.output.productNamePlaceholder}
                                            className="bg-white"
                                        />
                                        {errors.nama_produk && (
                                            <p className="text-xs text-rose-600">{errors.nama_produk}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="deskripsi_produk" className="text-xs font-medium text-slate-700">
                                            {t.output.description} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Textarea
                                            id="deskripsi_produk"
                                            rows={3}
                                            value={data.deskripsi_produk}
                                            onChange={(e) => setData('deskripsi_produk', e.target.value)}
                                            placeholder={t.output.descriptionPlaceholder}
                                            className="bg-white"
                                        />
                                        {errors.deskripsi_produk && (
                                            <p className="text-xs text-rose-600">{errors.deskripsi_produk}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="tingkat_kesiapan_teknologi" className="text-xs font-medium text-slate-700">
                                            {t.output.tkt} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Select
                                            value={String(data.tingkat_kesiapan_teknologi)}
                                            onValueChange={(val) => setData('tingkat_kesiapan_teknologi', Number(val))}
                                        >
                                            <SelectTrigger id="tingkat_kesiapan_teknologi" className="bg-white font-mono">
                                                <SelectValue placeholder={t.output.tktPlaceholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                                                    <SelectItem key={lvl} value={String(lvl)}>
                                                        TKT {lvl}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.tingkat_kesiapan_teknologi && (
                                            <p className="text-xs text-rose-600">{errors.tingkat_kesiapan_teknologi}</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Standard PDF Uploader Component */}
                    <div className="space-y-2 pt-2">
                        <PDFUploader
                            value={data.file_dokumen}
                            onChange={(file) => setData('file_dokumen', file)}
                            maxSizeMB={10}
                            label={t.output.fileUploadLabel}
                            helperText={t.output.fileUploadHelp}
                            required
                        />
                        {errors.file_dokumen && (
                            <p className="text-xs font-medium text-rose-600">{errors.file_dokumen}</p>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <DialogFooter className="gap-2 border-t border-slate-200 pt-4 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                            {t.output.cancel}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.file_dokumen}
                            className="bg-blue-900 text-white hover:bg-blue-800"
                        >
                            {processing ? (
                                <span className="flex items-center gap-1.5">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t.output.submitting}
                                </span>
                            ) : (
                                t.output.submitOutput
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateModal;
