/**
 * @file Index.tsx
 * @description Master Kriteria Penilaian: Seleksi Administrasi Dinamis & Rubrik Substansi.
 *              Menggunakan Hybrid Scholarly Enterprise Design System dan i18n terstandarisasi.
 */

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import PageHeader from '@/components/ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ClipboardCheck, Edit, FileText, Layers, ListChecks, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AssessmentCriterion {
    id: number;
    nama_kriteria: string;
    tahap_seleksi: 'Administrasi' | 'Substansi';
    tipe_jawaban: 'Ya_Tidak' | 'Pilihan_Ganda';
    bobot: number;
    deskripsi?: string | null;
    urutan: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    criteria: PaginatedData<AssessmentCriterion>;
    filters: {
        tahap_seleksi?: string;
        tipe_jawaban?: string;
        is_active?: string;
        search?: string;
    };
}

export default function CriteriaIndex({ criteria, filters }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: '/dashboard' },
        { title: t.adminCriteria.pageTitle, href: route('admin.criteria.index') },
    ];

    // Local filters
    const [search, setSearch] = useState(filters.search || '');
    const [stageFilter, setStageFilter] = useState(filters.tahap_seleksi || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.is_active || 'all');

    // Dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedCriterion, setSelectedCriterion] = useState<AssessmentCriterion | null>(null);

    // Form: Create
    const createForm = useForm({
        nama_kriteria: '',
        tahap_seleksi: 'Administrasi',
        tipe_jawaban: 'Ya_Tidak',
        bobot: 0,
        urutan: 1,
        deskripsi: '',
        is_active: true,
    });

    // Form: Edit
    const editForm = useForm({
        nama_kriteria: '',
        tahap_seleksi: 'Administrasi',
        tipe_jawaban: 'Ya_Tidak',
        bobot: 0,
        urutan: 1,
        deskripsi: '',
        is_active: true,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Apply filters
    const applyFilters = useCallback(
        (overrides: Record<string, string> = {}) => {
            const params: Record<string, string> = {
                search,
                tahap_seleksi: stageFilter === 'all' ? '' : stageFilter,
                is_active: statusFilter === 'all' ? '' : statusFilter,
                ...overrides,
            };

            Object.keys(params).forEach((key) => {
                if (!params[key]) delete params[key];
            });

            router.get(route('admin.criteria.index'), params, {
                preserveState: true,
                preserveScroll: true,
            });
        },
        [search, stageFilter, statusFilter],
    );

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleClearFilters = () => {
        setSearch('');
        setStageFilter('all');
        setStatusFilter('all');
        router.get(route('admin.criteria.index'));
    };

    const handleStageTab = (stage: string) => {
        setStageFilter(stage);
        applyFilters({ tahap_seleksi: stage === 'all' ? '' : stage });
    };

    // Open create dialog
    const handleOpenCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        createForm.setData({
            nama_kriteria: '',
            tahap_seleksi: stageFilter === 'Substansi' ? 'Substansi' : 'Administrasi',
            tipe_jawaban: stageFilter === 'Substansi' ? 'Pilihan_Ganda' : 'Ya_Tidak',
            bobot: stageFilter === 'Substansi' ? 20 : 0,
            urutan: (criteria.total ?? 0) + 1,
            deskripsi: '',
            is_active: true,
        });
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.criteria.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                toast.success(t.adminCriteria.saveSuccess);
            },
            onError: () => {
                toast.error(t.adminCriteria.saveError);
            },
        });
    };

    // Open edit dialog
    const handleOpenEdit = (item: AssessmentCriterion) => {
        setSelectedCriterion(item);
        editForm.setData({
            nama_kriteria: item.nama_kriteria,
            tahap_seleksi: item.tahap_seleksi,
            tipe_jawaban: item.tipe_jawaban,
            bobot: item.bobot,
            urutan: item.urutan,
            deskripsi: item.deskripsi || '',
            is_active: item.is_active,
        });
        editForm.clearErrors();
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCriterion) return;
        editForm.put(route('admin.criteria.update', selectedCriterion.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedCriterion(null);
                toast.success(t.adminCriteria.saveSuccess);
            },
            onError: () => {
                toast.error(t.adminCriteria.saveError);
            },
        });
    };

    // Open delete dialog
    const handleOpenDelete = (item: AssessmentCriterion) => {
        setSelectedCriterion(item);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedCriterion) return;
        router.delete(route('admin.criteria.destroy', selectedCriterion.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedCriterion(null);
                toast.success(t.adminCriteria.deleteSuccess);
            },
        });
    };

    const hasActiveFilters = Boolean(search || (stageFilter && stageFilter !== 'all') || (statusFilter && statusFilter !== 'all'));
    const criteriaList = criteria.data ?? [];
    const isEmpty = criteriaList.length === 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminCriteria.pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* PageHeader */}
                <PageHeader
                    title={t.adminCriteria.pageTitle}
                    subtitle={t.adminCriteria.pageSubtitle}
                    isEditorialSerif={false}
                    breadcrumbs={breadcrumbs}
                    actions={
                        <div className="flex items-center gap-3">
                            <LanguageSwitcher variant="compact" />
                            <Button onClick={handleOpenCreate} className="gap-2 bg-blue-900 font-medium text-white hover:bg-blue-800">
                                <Plus className="h-4 w-4" />
                                {t.adminCriteria.btnCreate}
                            </Button>
                        </div>
                    }
                />

                {/* Stage Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                    <Button
                        variant={stageFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStageTab('all')}
                        className={stageFilter === 'all' ? 'bg-blue-900 text-white dark:bg-blue-600' : 'dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'}
                    >
                        <Layers className="mr-1.5 h-4 w-4" />
                        {t.adminCriteria.tabAll}
                    </Button>
                    <Button
                        variant={stageFilter === 'Administrasi' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStageTab('Administrasi')}
                        className={stageFilter === 'Administrasi' ? 'bg-blue-900 text-white dark:bg-blue-600' : 'dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'}
                    >
                        <ListChecks className="mr-1.5 h-4 w-4" />
                        {t.adminCriteria.tabAdmin}
                    </Button>
                    <Button
                        variant={stageFilter === 'Substansi' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStageTab('Substansi')}
                        className={stageFilter === 'Substansi' ? 'bg-blue-900 text-white dark:bg-blue-600' : 'dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'}
                    >
                        <ClipboardCheck className="mr-1.5 h-4 w-4" />
                        {t.adminCriteria.tabSubstantive}
                    </Button>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder={t.adminCriteria.searchPlaceholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-10 border-slate-300 bg-white pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                                />
                            </div>

                            <Select
                                value={statusFilter}
                                onValueChange={(val) => {
                                    setStatusFilter(val);
                                    applyFilters({ is_active: val === 'all' ? '' : val });
                                }}
                            >
                                <SelectTrigger className="h-10 w-full border-slate-300 bg-white text-sm sm:w-44 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                                    <SelectValue placeholder={t.adminCriteria.filterStatus} />
                                </SelectTrigger>
                                <SelectContent className="dark:border-slate-800 dark:bg-slate-900">
                                    <SelectItem value="all">{t.adminCriteria.allStatuses}</SelectItem>
                                    <SelectItem value="1">{t.adminCriteria.statusActive}</SelectItem>
                                    <SelectItem value="0">{t.adminCriteria.statusInactive}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button type="submit" variant="secondary" className="h-10 px-5 font-semibold">
                                {t.common.search}
                            </Button>

                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleClearFilters}
                                    className="h-10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    {t.common.reset}
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                            <TableRow className="border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[60px] text-center font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.tableColNo}</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.tableColName}</TableHead>
                                <TableHead className="w-[140px] font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.tableColStage}</TableHead>
                                <TableHead className="w-[180px] font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.tableColType}</TableHead>
                                <TableHead className="w-[110px] text-center font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.tableColWeight}</TableHead>
                                <TableHead className="w-[80px] text-center font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.tableColOrder}</TableHead>
                                <TableHead className="w-[120px] font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.tableColStatus}</TableHead>
                                <TableHead className="w-[110px] text-right font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.tableColActions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isEmpty ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                            <p className="font-medium">{t.adminCriteria.emptyTitle}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">{t.adminCriteria.emptySubtitle}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                criteriaList.map((item, index) => {
                                    const rowNumber = (criteria.current_page - 1) * criteria.per_page + index + 1;
                                    return (
                                        <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                                            <TableCell className="text-center font-mono text-xs text-slate-500 dark:text-slate-400">{rowNumber}</TableCell>
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.nama_kriteria}</p>
                                                    {item.deskripsi && <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{item.deskripsi}</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        item.tahap_seleksi === 'Administrasi'
                                                            ? 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/50 dark:text-sky-300'
                                                            : 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800/50 dark:bg-indigo-950/50 dark:text-indigo-300'
                                                    }
                                                >
                                                    {item.tahap_seleksi === 'Administrasi'
                                                        ? t.adminCriteria.stageAdmin
                                                        : t.adminCriteria.stageSubstantive}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                    {item.tipe_jawaban === 'Ya_Tidak'
                                                        ? t.adminCriteria.typeYesNo
                                                        : t.adminCriteria.typeMultipleChoice}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">{item.bobot}%</span>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-xs text-slate-600 dark:text-slate-400">{item.urutan}</TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={item.is_active ? 'Draft' : 'Terminated'}
                                                    labelOverride={item.is_active ? t.adminCriteria.statusActive : t.adminCriteria.statusInactive}
                                                    size="sm"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDelete(item)}
                                                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {criteria.total > criteria.per_page && (
                        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Menampilkan {criteria.from} – {criteria.to} dari {criteria.total} kriteria
                                </p>
                                <div className="flex items-center gap-1">
                                    {criteria.links.map((link, idx) => {
                                        if (!link.url) return null;
                                        return (
                                            <Link key={idx} href={link.url} preserveState preserveScroll>
                                                <Button
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="sm"
                                                    className={link.active ? 'bg-blue-900 text-white dark:bg-blue-600' : 'dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'}
                                                >
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                </Button>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CREATE DIALOG ─────────────────────────────────────────────── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[540px] dark:border-slate-800 dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.adminCriteria.createTitle}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">{t.adminCriteria.createSubtitle}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                        {/* Tahap Seleksi */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.fieldStage}</Label>
                            <Select
                                value={createForm.data.tahap_seleksi}
                                onValueChange={(val: 'Administrasi' | 'Substansi') => {
                                    createForm.setData((prev) => ({
                                        ...prev,
                                        tahap_seleksi: val,
                                        tipe_jawaban: val === 'Administrasi' ? 'Ya_Tidak' : 'Pilihan_Ganda',
                                        bobot: val === 'Administrasi' ? 0 : 20,
                                    }));
                                }}
                            >
                                <SelectTrigger className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="dark:border-slate-800 dark:bg-slate-900">
                                    <SelectItem value="Administrasi">{t.adminCriteria.stageAdmin}</SelectItem>
                                    <SelectItem value="Substansi">{t.adminCriteria.stageSubstantive}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nama Kriteria */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create-nama" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t.adminCriteria.fieldName} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="create-nama"
                                value={createForm.data.nama_kriteria}
                                onChange={(e) => createForm.setData('nama_kriteria', e.target.value)}
                                className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                required
                            />
                            {createForm.errors.nama_kriteria && <p className="text-xs text-rose-600 dark:text-rose-400">{createForm.errors.nama_kriteria}</p>}
                        </div>

                        {/* Tipe Jawaban & Bobot */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.fieldType}</Label>
                                <Select
                                    value={createForm.data.tipe_jawaban}
                                    onValueChange={(val: 'Ya_Tidak' | 'Pilihan_Ganda') => createForm.setData('tipe_jawaban', val)}
                                >
                                    <SelectTrigger className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dark:border-slate-800 dark:bg-slate-900">
                                        <SelectItem value="Ya_Tidak">{t.adminCriteria.typeYesNo}</SelectItem>
                                        <SelectItem value="Pilihan_Ganda">{t.adminCriteria.typeMultipleChoice}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-bobot" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {t.adminCriteria.fieldWeight}
                                </Label>
                                <Input
                                    id="create-bobot"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={createForm.data.bobot}
                                    onChange={(e) => createForm.setData('bobot', Number(e.target.value))}
                                    className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        {/* Urutan */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create-urutan" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t.adminCriteria.fieldOrder}
                            </Label>
                            <Input
                                id="create-urutan"
                                type="number"
                                min="1"
                                value={createForm.data.urutan}
                                onChange={(e) => createForm.setData('urutan', Number(e.target.value))}
                                className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />
                        </div>

                        {/* Deskripsi */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create-desc" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t.adminCriteria.fieldDesc}
                            </Label>
                            <Textarea
                                id="create-desc"
                                value={createForm.data.deskripsi}
                                onChange={(e) => createForm.setData('deskripsi', e.target.value)}
                                rows={3}
                                className="resize-none border-slate-300 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />
                        </div>

                        {/* Status Aktif */}
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="space-y-0.5">
                                <Label htmlFor="create-status" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {t.adminCriteria.fieldStatus}
                                </Label>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Aktifkan agar butir kriteria digunakan pada penilaian.</p>
                            </div>
                            <Switch
                                id="create-status"
                                checked={createForm.data.is_active}
                                onCheckedChange={(val) => createForm.setData('is_active', val)}
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="dark:border-slate-700 dark:text-slate-300">
                                {t.adminCriteria.btnCancel}
                            </Button>
                            <Button type="submit" disabled={createForm.processing} className="bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500">
                                {createForm.processing ? t.common.loading : t.adminCriteria.btnSave}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── EDIT DIALOG ───────────────────────────────────────────────── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[540px] dark:border-slate-800 dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.adminCriteria.editTitle}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">{t.adminCriteria.editSubtitle}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                        {/* Tahap Seleksi */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.fieldStage}</Label>
                            <Select
                                value={editForm.data.tahap_seleksi}
                                onValueChange={(val: 'Administrasi' | 'Substansi') => editForm.setData('tahap_seleksi', val)}
                            >
                                <SelectTrigger className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="dark:border-slate-800 dark:bg-slate-900">
                                    <SelectItem value="Administrasi">{t.adminCriteria.stageAdmin}</SelectItem>
                                    <SelectItem value="Substansi">{t.adminCriteria.stageSubstantive}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nama Kriteria */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-nama" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t.adminCriteria.fieldName} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="edit-nama"
                                value={editForm.data.nama_kriteria}
                                onChange={(e) => editForm.setData('nama_kriteria', e.target.value)}
                                className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                required
                            />
                            {editForm.errors.nama_kriteria && <p className="text-xs text-rose-600 dark:text-rose-400">{editForm.errors.nama_kriteria}</p>}
                        </div>

                        {/* Tipe Jawaban & Bobot */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.adminCriteria.fieldType}</Label>
                                <Select
                                    value={editForm.data.tipe_jawaban}
                                    onValueChange={(val: 'Ya_Tidak' | 'Pilihan_Ganda') => editForm.setData('tipe_jawaban', val)}
                                >
                                    <SelectTrigger className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dark:border-slate-800 dark:bg-slate-900">
                                        <SelectItem value="Ya_Tidak">{t.adminCriteria.typeYesNo}</SelectItem>
                                        <SelectItem value="Pilihan_Ganda">{t.adminCriteria.typeMultipleChoice}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-bobot" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {t.adminCriteria.fieldWeight}
                                </Label>
                                <Input
                                    id="edit-bobot"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editForm.data.bobot}
                                    onChange={(e) => editForm.setData('bobot', Number(e.target.value))}
                                    className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        {/* Urutan */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-urutan" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t.adminCriteria.fieldOrder}
                            </Label>
                            <Input
                                id="edit-urutan"
                                type="number"
                                min="1"
                                value={editForm.data.urutan}
                                onChange={(e) => editForm.setData('urutan', Number(e.target.value))}
                                className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />
                        </div>

                        {/* Deskripsi */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-desc" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t.adminCriteria.fieldDesc}
                            </Label>
                            <Textarea
                                id="edit-desc"
                                value={editForm.data.deskripsi}
                                onChange={(e) => editForm.setData('deskripsi', e.target.value)}
                                rows={3}
                                className="resize-none border-slate-300 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />
                        </div>

                        {/* Status Aktif */}
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="space-y-0.5">
                                <Label htmlFor="edit-status" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {t.adminCriteria.fieldStatus}
                                </Label>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Aktifkan agar butir kriteria digunakan pada penilaian.</p>
                            </div>
                            <Switch
                                id="edit-status"
                                checked={editForm.data.is_active}
                                onCheckedChange={(val) => editForm.setData('is_active', val)}
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="dark:border-slate-700 dark:text-slate-300">
                                {t.adminCriteria.btnCancel}
                            </Button>
                            <Button type="submit" disabled={editForm.processing} className="bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500">
                                {editForm.processing ? t.common.loading : t.adminCriteria.btnSave}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── DELETE DIALOG ─────────────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="dark:border-slate-800 dark:bg-slate-900">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-slate-100">{t.adminCriteria.deleteConfirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            {t.adminCriteria.deleteConfirmDesc} ({selectedCriterion?.nama_kriteria})
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:border-slate-700 dark:text-slate-300">{t.adminCriteria.btnCancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 text-white hover:bg-rose-700">
                            {t.common.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
