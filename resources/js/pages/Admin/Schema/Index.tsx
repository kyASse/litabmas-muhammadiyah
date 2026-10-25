/**
 * @file Index.tsx
 * @description Halaman manajemen Skema Penelitian (Admin).
 *              Menampilkan tabel skema dengan pagination, sorting, filter status,
 *              dan operasi CRUD (tambah/edit/hapus) melalui dialog inline.
 * @dependency  SchemaController@index()
 * @author      RAKA BONDAN PRASETYO
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TabularFigure from '@/components/ui/TabularFigure';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Coins,
    Edit,
    Eye,
    FileText,
    Loader2,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/* -------------------------------------------------------------------------- */
/*  Breadcrumbs                                                                */
/* -------------------------------------------------------------------------- */

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Skema Penelitian', href: '/admin/schema' },
];

/* -------------------------------------------------------------------------- */
/*  Type Definitions                                                           */
/* -------------------------------------------------------------------------- */

interface Schema {
    id: number;
    name: string;
    description: string | null;
    max_funding: number;
    is_active: boolean;
    tahun_anggaran?: number;
    year?: number;
    proposals_count: number;
    created_at: string;
    updated_at: string;
}

interface PaginatedSchemas {
    data: Schema[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
    links?:
        | Array<{
              url: string | null;
              label: string;
              active: boolean;
          }>
        | {
              first?: string;
              last?: string;
              prev?: string | null;
              next?: string | null;
          };
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
}

interface Filters {
    search: string;
    is_active: string;
    tahun_anggaran?: string;
    year?: string;
    sort_by: string;
    sort_dir: string;
}

interface Props {
    schemas: PaginatedSchemas;
    filters: Filters;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Format angka ke format Rupiah */
function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Format tanggal ke "21 Jul 2026" */
function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/* -------------------------------------------------------------------------- */
/*  Sortable Table Head Component                                              */
/* -------------------------------------------------------------------------- */

interface SortableHeadProps {
    label: string;
    column: string;
    currentSort: string;
    currentDir: string;
    onSort: (column: string) => void;
    className?: string;
}

function SortableHead({ label, column, currentSort, currentDir, onSort, className = '' }: SortableHeadProps) {
    const isActive = currentSort === column;

    return (
        <TableHead
            className={`cursor-pointer font-semibold transition-colors select-none hover:text-foreground ${className}`}
            onClick={() => onSort(column)}
        >
            <div className="flex items-center gap-1.5">
                {label}
                {isActive ? (
                    currentDir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    )
                ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
            </div>
        </TableHead>
    );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function SchemaIndex({ schemas, filters }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t, format, locale } = useTranslation();

    // Local filter states
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.is_active || 'all');
    const [yearFilter, setYearFilter] = useState(filters.tahun_anggaran || filters.year || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortDir, setSortDir] = useState(filters.sort_dir || 'desc');

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);

    // Forms
    const createForm = useForm({
        name: '',
        description: '',
        tahun_anggaran: new Date().getFullYear(),
        max_funding: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        description: '',
        tahun_anggaran: new Date().getFullYear(),
        max_funding: '',
        is_active: true,
    });

    // --- Flash toast ---------------------------------------------------------
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // --- Navigation helper ---------------------------------------------------
    const applyFilters = useCallback(
        (overrides: Record<string, string> = {}) => {
            const params: Record<string, string> = {
                search,
                is_active: statusFilter === 'all' ? '' : statusFilter,
                tahun_anggaran: yearFilter,
                sort_by: sortBy,
                sort_dir: sortDir,
                ...overrides,
            };

            // Remove empty params
            Object.keys(params).forEach((key) => {
                if (!params[key]) delete params[key];
            });

            router.get(route('admin.schema.index'), params, {
                preserveState: true,
                preserveScroll: true,
            });
        },
        [search, statusFilter, yearFilter, sortBy, sortDir],
    );

    // --- Search --------------------------------------------------------------
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleClearSearch = () => {
        setSearch('');
        setStatusFilter('all');
        setYearFilter('');
        setSortBy('created_at');
        setSortDir('desc');
        router.get(route('admin.schema.index'));
    };

    // --- Status filter -------------------------------------------------------
    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        applyFilters({ is_active: value === 'all' ? '' : value });
    };

    // --- Sorting -------------------------------------------------------------
    const handleSort = (column: string) => {
        let newDir = 'asc';
        if (sortBy === column && sortDir === 'asc') newDir = 'desc';
        setSortBy(column);
        setSortDir(newDir);
        applyFilters({ sort_by: column, sort_dir: newDir });
    };

    // --- CRUD: Create --------------------------------------------------------
    const handleOpenCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.schema.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    // --- CRUD: Edit ----------------------------------------------------------
    const handleOpenEdit = (schema: Schema) => {
        setSelectedSchema(schema);
        editForm.setData({
            name: schema.name,
            description: schema.description || '',
            tahun_anggaran: schema.tahun_anggaran || schema.year || new Date().getFullYear(),
            max_funding: String(schema.max_funding || ''),
            is_active: schema.is_active,
        });
        editForm.clearErrors();
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchema) return;
        editForm.put(route('admin.schema.update', selectedSchema.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedSchema(null);
                editForm.reset();
            },
        });
    };

    // --- CRUD: Delete --------------------------------------------------------
    const handleOpenDelete = (schema: Schema) => {
        setSelectedSchema(schema);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedSchema) return;
        router.delete(route('admin.schema.destroy', selectedSchema.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedSchema(null);
            },
        });
    };

    // --- Derived state -------------------------------------------------------
    const hasActiveFilters = Boolean(search || (statusFilter && statusFilter !== 'all') || yearFilter);
    const schemaList = schemas.data ?? [];
    const isEmpty = schemaList.length === 0;

    const currentPage = schemas.current_page ?? schemas.meta?.current_page ?? 1;
    const perPage = schemas.per_page ?? schemas.meta?.per_page ?? 10;
    const totalItems = schemas.total ?? schemas.meta?.total ?? schemaList.length;
    const fromItem = schemas.from ?? schemas.meta?.from ?? (schemaList.length > 0 ? (currentPage - 1) * perPage + 1 : 0);
    const toItem = schemas.to ?? schemas.meta?.to ?? Math.min(currentPage * perPage, totalItems);
    const lastPage = schemas.last_page ?? schemas.meta?.last_page ?? 1;
    const paginationLinks = schemas.meta?.links ?? (Array.isArray(schemas.links) ? schemas.links : []);

    /* ======================================================================== */
    /*  RENDER                                                                  */
    /* ======================================================================== */

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Skema Penelitian" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ── PageHeader ─────────────────────────────────────────────────────────────── */}
                <PageHeader
                    title={t.adminSchema.pageTitle}
                    subtitle={t.adminSchema.pageSubtitle}
                    isEditorialSerif={true}
                    actions={
                        <Button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 bg-blue-900 font-semibold text-white shadow-sm hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            {t.adminSchema.addSchemeBtn}
                        </Button>
                    }
                />

                {/* ── Filters ────────────────────────────────────────── */}
                <Card className="border-sidebar-border/60 bg-white/70 shadow-sm backdrop-blur-md dark:border-sidebar-border dark:bg-neutral-950/70">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
                            {/* Search input */}
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari berdasarkan nama atau deskripsi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-10 border-sidebar-border bg-white pl-9 dark:bg-neutral-900"
                                />
                            </div>

                            {/* Status filter */}
                            <Select value={statusFilter} onValueChange={handleStatusChange}>
                                <SelectTrigger className="h-10 w-full border-sidebar-border bg-white sm:w-44 dark:bg-neutral-900">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="1">Aktif</SelectItem>
                                    <SelectItem value="0">Nonaktif</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Year filter */}
                            <Input
                                type="number"
                                placeholder={t.adminSchema.filterYear}
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="h-10 w-full border-sidebar-border bg-white sm:w-36 dark:bg-neutral-900"
                            />

                            {/* Buttons */}
                            <Button type="submit" variant="secondary" className="h-10 px-5 font-semibold">
                                Cari
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleClearSearch}
                                    className="h-10 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Reset
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* ── Table ──────────────────────────────────────────── */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/60 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-950">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-neutral-50/50 dark:bg-neutral-900/30">
                                <TableRow className="border-sidebar-border/60">
                                    <TableHead className="w-[60px] text-center font-semibold">No</TableHead>
                                    <SortableHead label="Nama Skema" column="name" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} />
                                    <SortableHead label={t.adminSchema.tableColYear} column="tahun_anggaran" currentSort={sortBy} currentDir={sortDir} onSort={handleSort} className="w-[110px]" />
                                    <TableHead className="font-semibold">Deskripsi</TableHead>
                                    <SortableHead
                                        label="Pagu Dana"
                                        column="max_funding"
                                        currentSort={sortBy}
                                        currentDir={sortDir}
                                        onSort={handleSort}
                                        className="w-[160px]"
                                    />
                                    <SortableHead
                                        label="Status"
                                        column="is_active"
                                        currentSort={sortBy}
                                        currentDir={sortDir}
                                        onSort={handleSort}
                                        className="w-[110px]"
                                    />
                                    <SortableHead
                                        label="Proposal"
                                        column="proposals_count"
                                        currentSort={sortBy}
                                        currentDir={sortDir}
                                        onSort={handleSort}
                                        className="w-[110px]"
                                    />
                                    <SortableHead
                                        label="Dibuat"
                                        column="created_at"
                                        currentSort={sortBy}
                                        currentDir={sortDir}
                                        onSort={handleSort}
                                        className="w-[140px]"
                                    />
                                    <TableHead className="w-[120px] text-right font-semibold">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isEmpty ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <ClipboardList className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                                                <p className="font-medium">Tidak ada skema penelitian ditemukan.</p>
                                                {hasActiveFilters && (
                                                    <Button variant="link" size="sm" onClick={handleClearSearch} className="text-emerald-600">
                                                        Reset filter
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    schemaList.map((schema, index) => {
                                        const rowNumber = (currentPage - 1) * perPage + index + 1;
                                        return (
                                            <TableRow
                                                key={schema.id}
                                                className="group border-sidebar-border/60 transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-900/20"
                                            >
                                                {/* No */}
                                                <TableCell className="text-center text-sm font-medium text-muted-foreground">{rowNumber}</TableCell>

                                                {/* Nama Skema */}
                                                <TableCell>
                                                    <span className="font-bold text-foreground">{schema.name}</span>
                                                </TableCell>

                                                {/* Tahun Anggaran */}
                                                <TableCell>
                                                    <span className="font-mono text-sm text-foreground">{schema.tahun_anggaran || schema.year || '—'}</span>
                                                </TableCell>

                                                {/* Deskripsi */}
                                                <TableCell className="max-w-[260px]">
                                                    {schema.description ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="line-clamp-2 cursor-default text-sm text-muted-foreground">
                                                                    {schema.description}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="bottom" className="max-w-xs">
                                                                {schema.description}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <em className="text-xs text-neutral-400">Tidak ada deskripsi</em>
                                                    )}
                                                </TableCell>

                                                {/* Pagu Dana */}
                                                <TableCell>
                                                    {schema.max_funding > 0 ? (
                                                        <TabularFigure value={schema.max_funding} type="currency" align="left" weight="semibold" />
                                                    ) : (
                                                        <span className="text-xs text-neutral-400">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    <StatusBadge
                                                        status={schema.is_active ? 'Draft' : 'Terminated'}
                                                        labelOverride={schema.is_active ? t.adminSchema.statusActive : t.adminSchema.statusInactive}
                                                        size="sm"
                                                    />
                                                </TableCell>

                                                {/* Proposals Count */}
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                                                        <span className="font-semibold text-foreground">{schema.proposals_count}</span>
                                                        <span className="text-muted-foreground">proposal</span>
                                                    </div>
                                                </TableCell>

                                                {/* Tanggal */}
                                                <TableCell className="text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                                                        {formatDate(schema.created_at)}
                                                    </div>
                                                </TableCell>

                                                {/* Aksi */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => schema?.id && router.get(route('admin.schema.show', schema.id))}
                                                                    className="h-8 w-8 text-neutral-500 hover:bg-blue-500/10 hover:text-blue-600"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Detail</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleOpenEdit(schema)}
                                                                    className="h-8 w-8 text-neutral-500 hover:bg-emerald-500/10 hover:text-emerald-600"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleOpenDelete(schema)}
                                                                    className="h-8 w-8 text-neutral-500 hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Hapus</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="block space-y-3 bg-neutral-50/30 p-4 md:hidden dark:bg-transparent">
                        {isEmpty ? (
                            <div className="rounded-lg border border-dashed bg-white p-6 py-12 text-center text-muted-foreground dark:bg-neutral-900">
                                <ClipboardList className="mx-auto mb-2 h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                                <p className="font-medium">Tidak ada skema penelitian ditemukan.</p>
                            </div>
                        ) : (
                            schemaList.map((schema) => (
                                <div
                                    key={schema.id}
                                    className="space-y-3 rounded-xl border border-sidebar-border/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900/40"
                                >
                                    {/* Top row: name + actions */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <h3 className="leading-snug font-bold text-foreground">{schema.name}</h3>
                                            <StatusBadge
                                                status={schema.is_active ? 'Draft' : 'Terminated'}
                                                labelOverride={schema.is_active ? t.adminSchema.statusActive : t.adminSchema.statusInactive}
                                                size="sm"
                                            />
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => schema?.id && router.get(route('admin.schema.show', schema.id))}
                                                className="h-8 w-8 text-neutral-500 hover:bg-blue-500/10 hover:text-blue-600"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleOpenEdit(schema)}
                                                className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleOpenDelete(schema)}
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {schema.description || <em className="text-xs text-neutral-400">Tidak ada deskripsi</em>}
                                    </p>

                                    {/* Bottom meta */}
                                    <div className="flex flex-wrap items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
                                        {schema.max_funding > 0 && (
                                            <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                                <TabularFigure value={schema.max_funding} type="currency" weight="semibold" size="sm" />
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-3 w-3 text-blue-500" />
                                            {schema.proposals_count} proposal
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(schema.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* ── Pagination ──────────────────────────────────── */}
                    {lastPage > 1 && (
                        <div className="border-t border-sidebar-border/60 px-6 py-4 dark:border-sidebar-border">
                            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                                <p className="text-center text-sm text-muted-foreground md:text-left">
                                    Menampilkan {fromItem} – {toItem} dari {totalItems} skema
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {paginationLinks.map((link, idx) => {
                                        if (link.url === null) return null;
                                        const isFirst = idx === 0;
                                        const isLast = idx === paginationLinks.length - 1;

                                        return (
                                            <Link key={idx} href={link.url} preserveState preserveScroll>
                                                <Button
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="sm"
                                                    className={
                                                        link.active
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950'
                                                            : 'text-muted-foreground'
                                                    }
                                                >
                                                    {isFirst ? (
                                                        <ChevronLeft className="h-4 w-4" />
                                                    ) : isLast ? (
                                                        <ChevronRight className="h-4 w-4" />
                                                    ) : (
                                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                    )}
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

            {/* ════════════════════════════════════════════════════════════════ */}
            {/*  CREATE DIALOG                                                 */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                <Plus className="h-4 w-4" />
                            </div>
                            Tambah Skema Penelitian
                        </DialogTitle>
                        <DialogDescription>Isi detail informasi untuk membuat skema penelitian baru.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="create-name" className="text-sm font-semibold">
                                Nama Skema <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="create-name"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="Contoh: Penelitian Terapan Kompetitif"
                                className="h-10"
                                disabled={createForm.processing}
                            />
                            {createForm.errors.name && <p className="text-xs font-semibold text-destructive">{createForm.errors.name}</p>}
                        </div>

                        {/* Tahun Anggaran */}
                        <div className="space-y-2">
                            <Label htmlFor="create-tahun-anggaran" className="text-sm font-semibold">
                                {t.adminSchema.yearLabel} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="create-tahun-anggaran"
                                type="number"
                                min="2000"
                                max="2100"
                                value={createForm.data.tahun_anggaran}
                                onChange={(e) => createForm.setData('tahun_anggaran', parseInt(e.target.value) || new Date().getFullYear())}
                                placeholder={t.adminSchema.yearPlaceholder}
                                className="h-10"
                                disabled={createForm.processing}
                            />
                            {createForm.errors.tahun_anggaran && <p className="text-xs font-semibold text-destructive">{createForm.errors.tahun_anggaran}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="create-description" className="text-sm font-semibold">
                                Deskripsi
                            </Label>
                            <Textarea
                                id="create-description"
                                value={createForm.data.description}
                                onChange={(e) => createForm.setData('description', e.target.value)}
                                placeholder="Tuliskan deskripsi singkat mengenai skema penelitian ini..."
                                className="min-h-[80px] resize-none"
                                disabled={createForm.processing}
                            />
                            {createForm.errors.description && (
                                <p className="text-xs font-semibold text-destructive">{createForm.errors.description}</p>
                            )}
                        </div>

                        {/* Max funding */}
                        <div className="space-y-2">
                            <Label htmlFor="create-max-funding" className="text-sm font-semibold">
                                Pagu Dana Maksimal (Rp)
                            </Label>
                            <div className="relative">
                                <Coins className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="create-max-funding"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={createForm.data.max_funding}
                                    onChange={(e) => createForm.setData('max_funding', e.target.value)}
                                    placeholder="0"
                                    className="h-10 pl-9"
                                    disabled={createForm.processing}
                                />
                            </div>
                            {createForm.errors.max_funding && (
                                <p className="text-xs font-semibold text-destructive">{createForm.errors.max_funding}</p>
                            )}
                        </div>

                        {/* Status active */}
                        <div className="flex items-center justify-between rounded-lg border border-sidebar-border/60 p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="create-is-active" className="text-sm font-semibold">
                                    Status Aktif
                                </Label>
                                <p className="text-xs text-muted-foreground">Skema yang aktif dapat dipilih oleh dosen saat mengajukan proposal.</p>
                            </div>
                            <Switch
                                id="create-is-active"
                                checked={createForm.data.is_active}
                                onCheckedChange={(checked) => createForm.setData('is_active', checked)}
                                disabled={createForm.processing}
                            />
                        </div>

                        <DialogFooter className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createForm.processing}>
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
                                disabled={createForm.processing}
                            >
                                {createForm.processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/*  EDIT DIALOG                                                   */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <Edit className="h-4 w-4" />
                            </div>
                            Edit Skema Penelitian
                        </DialogTitle>
                        <DialogDescription>Perbarui data skema penelitian yang sudah ada.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-sm font-semibold">
                                Nama Skema <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                placeholder="Masukkan nama skema..."
                                className="h-10"
                                disabled={editForm.processing}
                            />
                            {editForm.errors.name && <p className="text-xs font-semibold text-destructive">{editForm.errors.name}</p>}
                        </div>

                        {/* Tahun Anggaran */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-tahun-anggaran" className="text-sm font-semibold">
                                {t.adminSchema.yearLabel} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-tahun-anggaran"
                                type="number"
                                min="2000"
                                max="2100"
                                value={editForm.data.tahun_anggaran}
                                onChange={(e) => editForm.setData('tahun_anggaran', parseInt(e.target.value) || new Date().getFullYear())}
                                placeholder={t.adminSchema.yearPlaceholder}
                                className="h-10"
                                disabled={editForm.processing}
                            />
                            {editForm.errors.tahun_anggaran && <p className="text-xs font-semibold text-destructive">{editForm.errors.tahun_anggaran}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-description" className="text-sm font-semibold">
                                Deskripsi
                            </Label>
                            <Textarea
                                id="edit-description"
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                                placeholder="Masukkan deskripsi skema..."
                                className="min-h-[80px] resize-none"
                                disabled={editForm.processing}
                            />
                            {editForm.errors.description && <p className="text-xs font-semibold text-destructive">{editForm.errors.description}</p>}
                        </div>

                        {/* Max funding */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-max-funding" className="text-sm font-semibold">
                                Pagu Dana Maksimal (Rp)
                            </Label>
                            <div className="relative">
                                <Coins className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="edit-max-funding"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editForm.data.max_funding}
                                    onChange={(e) => editForm.setData('max_funding', e.target.value)}
                                    placeholder="0"
                                    className="h-10 pl-9"
                                    disabled={editForm.processing}
                                />
                            </div>
                            {editForm.errors.max_funding && <p className="text-xs font-semibold text-destructive">{editForm.errors.max_funding}</p>}
                        </div>

                        {/* Status active */}
                        <div className="flex items-center justify-between rounded-lg border border-sidebar-border/60 p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="edit-is-active" className="text-sm font-semibold">
                                    Status Aktif
                                </Label>
                                <p className="text-xs text-muted-foreground">Skema yang aktif dapat dipilih oleh dosen saat mengajukan proposal.</p>
                            </div>
                            <Switch
                                id="edit-is-active"
                                checked={editForm.data.is_active}
                                onCheckedChange={(checked) => editForm.setData('is_active', checked)}
                                disabled={editForm.processing}
                            />
                        </div>

                        <DialogFooter className="flex gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={editForm.processing}>
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
                                disabled={editForm.processing}
                            >
                                {editForm.processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memperbarui...
                                    </>
                                ) : (
                                    'Simpan Perubahan'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/*  DELETE DIALOG                                                 */}
            {/* ════════════════════════════════════════════════════════════════ */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 font-bold text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Hapus Skema Penelitian?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-600 dark:text-neutral-400">
                            Apakah Anda yakin ingin menghapus skema penelitian <strong>{selectedSchema?.name}</strong>? Tindakan ini tidak dapat
                            dibatalkan dan skema tidak dapat dihapus apabila sudah terhubung dengan proposal dosen aktif.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
