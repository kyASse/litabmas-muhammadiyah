import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Download, FileText, Plus, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Proposal {
    id: number;
    judul?: string;
    title?: string;
    nomor_proposal?: string;
}

interface MonevSchedule {
    id: number;
    nama_tahap: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
}

interface ProgressReportItem {
    id: number;
    id_proposal?: number;
    id_monev_schedule?: number;
    persentase_kemajuan: number;
    ringkasan_progres: string;
    catatan_kendala?: string | null;
    file_laporan_kemajuan?: string | null;
    file_logbook?: string | null;
    skor_monev?: number | string | null;
    catatan_reviewer_monev?: string | null;
    status_laporan: string;
    created_at: string;
    proposal?: Proposal;
    monevSchedule?: MonevSchedule;
    monev_schedule?: MonevSchedule;
}

interface Filters {
    search?: string;
    status?: string;
}

interface Props {
    progressReports: {
        data: ProgressReportItem[];
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
    filters: Filters;
}

export default function ProgressIndex({ progressReports, filters: initialFilters }: Props) {
    const { t, locale } = useTranslation();
    const [search, setSearch] = useState(initialFilters?.search || '');
    const [status, setStatus] = useState(initialFilters?.status || 'all');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t.navigation.dashboard, href: route('dashboard') },
        { title: t.monev.progressListTitle, href: route('progress.index') },
    ];

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('progress.index'),
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true },
        );
    };

    const handleStatusFilter = (val: string) => {
        setStatus(val);
        router.get(
            route('progress.index'),
            {
                search: search || undefined,
                status: val !== 'all' ? val : undefined,
            },
            { preserveState: true },
        );
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const mapStatus = (statusStr: string) => {
        const lower = (statusStr || '').toLowerCase();
        if (lower === 'approved') return 'Monev_Approved';
        if (lower === 'revision') return 'Revisi';
        return 'Submitted';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.monev.progressListTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-sans text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t.monev.progressListTitle}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{t.monev.progressListSubtitle}</p>
                    </div>

                    <Button asChild className="bg-blue-900 text-white hover:bg-blue-800">
                        <Link href={route('progress.create')} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {t.monev.submitProgressBtn}
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="border-border shadow-sm">
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder={t.common.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                            </div>

                            <Select value={status} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder={t.common.all} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t.common.all}</SelectItem>
                                    <SelectItem value="submitted">{t.statuses.Submitted}</SelectItem>
                                    <SelectItem value="approved">{t.statuses.Approved}</SelectItem>
                                    <SelectItem value="revision">{t.statuses.Revision}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button type="submit" variant="secondary">
                                {t.common.filter}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColProposal}</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColSchedule}</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColPercentage}</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColReportFile}</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColScore}</TableHead>
                                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColReportStatus}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {progressReports.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                        <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                        <p className="text-sm">{t.monev.emptyProgress}</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                progressReports.data.map((report) => {
                                    const sched = report.monevSchedule || report.monev_schedule;
                                    return (
                                        <TableRow key={report.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60">
                                            <TableCell>
                                                <div className="font-medium text-foreground">
                                                    {report.proposal?.judul ||
                                                        report.proposal?.title ||
                                                        `Proposal #${report.id_proposal || report.id}`}
                                                </div>
                                                {report.proposal?.nomor_proposal && (
                                                    <div className="font-mono text-xs text-muted-foreground">{report.proposal.nomor_proposal}</div>
                                                )}
                                                <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{report.ringkasan_progres}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-foreground">{sched?.nama_tahap || '-'}</div>
                                                {sched && (
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {formatDate(sched.tanggal_mulai)} - {formatDate(sched.tanggal_selesai)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <TabularFigure
                                                    value={report.persentase_kemajuan}
                                                    type="percentage"
                                                    weight="bold"
                                                    size="base"
                                                    align="left"
                                                    className="text-blue-900 dark:text-blue-400"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {report.file_laporan_kemajuan && (
                                                        <a
                                                            href={`/storage/${report.file_laporan_kemajuan}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 font-medium text-blue-900 hover:underline"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                            {t.monev.tableColReportFile}
                                                        </a>
                                                    )}
                                                    {report.file_logbook && (
                                                        <a
                                                            href={`/storage/${report.file_logbook}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-slate-600 hover:underline"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                            {t.monev.tableColLogbookFile}
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {report.skor_monev !== null && report.skor_monev !== undefined ? (
                                                    <TabularFigure
                                                        value={report.skor_monev}
                                                        type="score"
                                                        decimals={2}
                                                        weight="bold"
                                                        align="left"
                                                        className="text-slate-800 dark:text-slate-200"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={mapStatus(report.status_laporan)} size="sm" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {progressReports.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground">
                            {progressReports.from ?? 0} - {progressReports.to ?? 0} / {progressReports.total}
                        </p>
                        <div className="flex items-center gap-1">
                            {progressReports.links.map((link, idx) => (
                                <Button
                                    key={idx}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className="h-8 min-w-[32px] text-xs"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
