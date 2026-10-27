import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, CalendarCheck, Clock, FileText, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

interface MonevScheduleItem {
    id: number;
    nama_tahap: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    deskripsi?: string | null;
    is_active: boolean;
    status_label?: string;
    created_at?: string;
}

interface ProposalItem {
    id: number;
    judul?: string;
    title?: string;
    nomor_proposal?: string;
    user?: {
        id: number;
        name: string;
    };
}

interface PendingReportItem {
    id: number;
    id_proposal?: number;
    proposal_id?: number;
    persentase_kemajuan: number;
    ringkasan_progres: string;
    catatan_kendala?: string | null;
    file_laporan_kemajuan?: string | null;
    file_logbook?: string | null;
    skor_monev?: number | null;
    status_laporan: string;
    created_at: string;
    proposal?: ProposalItem;
    user?: {
        id: number;
        name: string;
        email?: string;
    };
}

interface Props {
    schedules: MonevScheduleItem[];
    pendingReports?: PendingReportItem[];
    activeTab?: string;
}

export default function Schedule({ schedules = [], pendingReports = [], activeTab = 'schedules' }: Props) {
    const { t, locale } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation.dashboard,
            href: route('dashboard'),
        },
        {
            title: t.monev.schedulePageTitle,
            href: route('admin.monev-schedules.index'),
        },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        nama_tahap: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        deskripsi: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post(route('admin.monev-schedules.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                reset();
                toast.success(t.monev.scheduleSaved);
            },
            onError: () => {
                toast.error(t.monev.saveScheduleError);
            },
        });
    };

    const handleTabChange = (value: string) => {
        if (value === 'schedules') {
            router.get(route('admin.monev-schedules.index'), {}, { preserveState: true });
        } else if (value === 'pending') {
            router.get(route('admin.monev-schedules.pending'), {}, { preserveState: true });
        }
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isWindowOpen = (schedule: MonevScheduleItem) => {
        if (!schedule.is_active || !schedule.tanggal_mulai || !schedule.tanggal_selesai) {
            return false;
        }
        const today = new Date().toISOString().slice(0, 10);
        const start = schedule.tanggal_mulai.slice(0, 10);
        const end = schedule.tanggal_selesai.slice(0, 10);
        return today >= start && today <= end;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.monev.schedulePageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">{t.monev.schedulePageTitle}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{t.monev.schedulePageSubtitle}</p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 bg-blue-900 text-white hover:bg-blue-800">
                                <Plus className="h-4 w-4" />
                                {t.monev.addScheduleBtn}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg dark:border-slate-800 dark:bg-slate-900">
                            <DialogHeader>
                                <DialogTitle className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">{t.monev.createScheduleTitle}</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">{t.monev.schedulePageSubtitle}</DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="nama_tahap" className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.monev.scheduleName} <span className="text-rose-600">*</span>
                                    </Label>
                                    <Input
                                        id="nama_tahap"
                                        placeholder={t.monev.scheduleNamePlaceholder}
                                        value={data.nama_tahap}
                                        onChange={(e) => setData('nama_tahap', e.target.value)}
                                        className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        required
                                    />
                                    {errors.nama_tahap && <p className="text-xs font-medium text-rose-600">{errors.nama_tahap}</p>}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="tanggal_mulai" className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                            {t.monev.startDate} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="tanggal_mulai"
                                            type="date"
                                            value={data.tanggal_mulai}
                                            onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                            className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            required
                                        />
                                        {errors.tanggal_mulai && <p className="text-xs font-medium text-rose-600">{errors.tanggal_mulai}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="tanggal_selesai" className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                            {t.monev.endDate} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="tanggal_selesai"
                                            type="date"
                                            value={data.tanggal_selesai}
                                            onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                            className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            required
                                        />
                                        {errors.tanggal_selesai && <p className="text-xs font-medium text-rose-600">{errors.tanggal_selesai}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="deskripsi" className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                                        {t.monev.description}
                                    </Label>
                                    <Textarea
                                        id="deskripsi"
                                        rows={3}
                                        placeholder={t.monev.descriptionPlaceholder}
                                        value={data.deskripsi}
                                        onChange={(e) => setData('deskripsi', e.target.value)}
                                        className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    {errors.deskripsi && <p className="text-xs font-medium text-rose-600">{errors.deskripsi}</p>}
                                </div>

                                <DialogFooter className="gap-2 border-t border-slate-200 pt-2 sm:gap-0 dark:border-slate-800">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="dark:border-slate-700 dark:text-slate-300">
                                        {t.common.cancel}
                                    </Button>
                                    <Button type="submit" disabled={processing} className="bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500">
                                        {processing ? t.common.loading : t.common.save}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="schedules" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {t.monev.schedulePageTitle}
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {t.monev.pendingReportsTab}
                            {pendingReports.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                    {pendingReports.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Schedules Content */}
                    <TabsContent value="schedules">
                        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColScheduleName}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColStartDate}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColEndDate}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColStatus}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.description}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <CalendarCheck className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                <p className="text-sm">{t.monev.emptySchedules}</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        schedules.map((schedule) => {
                                            const open = isWindowOpen(schedule);
                                            return (
                                                <TableRow key={schedule.id} className="border-slate-100 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                                    <TableCell className="font-medium text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 shrink-0 text-blue-900 dark:text-blue-400" />
                                                            <span>{schedule.nama_tahap}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm text-muted-foreground">
                                                        {formatDate(schedule.tanggal_mulai)}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm text-muted-foreground">
                                                        {formatDate(schedule.tanggal_selesai)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {open ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                                                                {t.monev.statusActive}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                {t.monev.statusClosed}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                                                        {schedule.deskripsi || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Pending Reports Content */}
                    <TabsContent value="pending">
                        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.tableColProposal}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.researcher}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColPercentage}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">{t.monev.documentFiles}</TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColReportStatus}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingReports.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                <p className="text-sm">{t.monev.noPendingReports}</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingReports.map((report) => (
                                            <TableRow key={report.id} className="border-slate-100 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40">
                                                <TableCell>
                                                    <div className="font-medium text-foreground">
                                                        {report.proposal?.judul || report.proposal?.title || '-'}
                                                    </div>
                                                    {report.proposal?.nomor_proposal && (
                                                        <div className="font-mono text-xs text-muted-foreground">
                                                            {report.proposal.nomor_proposal}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-foreground">
                                                    {report.proposal?.user?.name || report.user?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <TabularFigure
                                                        value={report.persentase_kemajuan}
                                                        type="percentage"
                                                        weight="bold"
                                                        align="left"
                                                        className="text-primary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {report.file_laporan_kemajuan && (
                                                            <a
                                                                href={`/storage/${report.file_laporan_kemajuan}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-blue-900 hover:underline dark:text-blue-400"
                                                            >
                                                                <FileText className="h-3.5 w-3.5" />
                                                                {t.monev.tableColReportFile}
                                                            </a>
                                                        )}
                                                        {report.file_logbook && (
                                                            <a
                                                                href={`/storage/${report.file_logbook}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-slate-600 hover:underline dark:text-slate-400"
                                                            >
                                                                <FileText className="h-3.5 w-3.5" />
                                                                {t.monev.tableColLogbookFile}
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        status={
                                                            report.status_laporan === 'Approved'
                                                                ? 'Monev_Approved'
                                                                : report.status_laporan === 'Revision'
                                                                  ? 'Revisi'
                                                                  : 'Submitted'
                                                        }
                                                        size="sm"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
