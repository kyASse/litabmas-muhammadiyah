import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calendar, CalendarCheck, Clock, FileText, Plus, ShieldCheck } from 'lucide-react';
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

export default function Schedule({
    schedules = [],
    pendingReports = [],
    activeTab = 'schedules',
}: Props) {
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
                toast.error('Gagal menyimpan jadwal monev. Periksa isian formulir.');
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
                    <div>
                        <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
                            {t.monev.schedulePageTitle}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t.monev.schedulePageSubtitle}
                        </p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 bg-blue-900 text-white hover:bg-blue-800">
                                <Plus className="h-4 w-4" />
                                {t.monev.addScheduleBtn}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="font-serif text-lg font-bold">
                                    {t.monev.createScheduleTitle}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    {t.monev.schedulePageSubtitle}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="nama_tahap" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        {t.monev.scheduleName} <span className="text-rose-600">*</span>
                                    </Label>
                                    <Input
                                        id="nama_tahap"
                                        placeholder={t.monev.scheduleNamePlaceholder}
                                        value={data.nama_tahap}
                                        onChange={(e) => setData('nama_tahap', e.target.value)}
                                        required
                                    />
                                    {errors.nama_tahap && (
                                        <p className="text-xs text-rose-600 font-medium">{errors.nama_tahap}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="tanggal_mulai" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            {t.monev.startDate} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="tanggal_mulai"
                                            type="date"
                                            value={data.tanggal_mulai}
                                            onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                            required
                                        />
                                        {errors.tanggal_mulai && (
                                            <p className="text-xs text-rose-600 font-medium">{errors.tanggal_mulai}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="tanggal_selesai" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                            {t.monev.endDate} <span className="text-rose-600">*</span>
                                        </Label>
                                        <Input
                                            id="tanggal_selesai"
                                            type="date"
                                            value={data.tanggal_selesai}
                                            onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                            required
                                        />
                                        {errors.tanggal_selesai && (
                                            <p className="text-xs text-rose-600 font-medium">{errors.tanggal_selesai}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="deskripsi" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        {t.monev.description}
                                    </Label>
                                    <Textarea
                                        id="deskripsi"
                                        rows={3}
                                        placeholder={t.monev.descriptionPlaceholder}
                                        value={data.deskripsi}
                                        onChange={(e) => setData('deskripsi', e.target.value)}
                                    />
                                    {errors.deskripsi && (
                                        <p className="text-xs text-rose-600 font-medium">{errors.deskripsi}</p>
                                    )}
                                </div>

                                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        {t.common.cancel}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-900 text-white hover:bg-blue-800"
                                    >
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
                            Laporan Pending
                            {pendingReports.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700">
                                    {pendingReports.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Schedules Content */}
                    <TabsContent value="schedules">
                        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColScheduleName}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColStartDate}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColEndDate}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColStatus}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.description}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <CalendarCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                                <p className="text-sm">{t.monev.emptySchedules}</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        schedules.map((schedule) => {
                                            const open = isWindowOpen(schedule);
                                            return (
                                                <TableRow key={schedule.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60">
                                                    <TableCell className="font-medium text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-blue-900 shrink-0" />
                                                            <span>{schedule.nama_tahap}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-mono text-muted-foreground">
                                                        {formatDate(schedule.tanggal_mulai)}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-mono text-muted-foreground">
                                                        {formatDate(schedule.tanggal_selesai)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {open ? (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                                {t.monev.statusActive}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                                                {t.monev.statusClosed}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
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
                        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/40">
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColProposal}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            Peneliti
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColPercentage}
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            Berkas Dokumen
                                        </TableHead>
                                        <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                                            {t.monev.tableColReportStatus}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingReports.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                                <p className="text-sm">Tidak ada laporan kemajuan yang menunggu evaluasi.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingReports.map((report) => (
                                            <TableRow key={report.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/60">
                                                <TableCell>
                                                    <div className="font-medium text-foreground">
                                                        {report.proposal?.judul || report.proposal?.title || '-'}
                                                    </div>
                                                    {report.proposal?.nomor_proposal && (
                                                        <div className="text-xs font-mono text-muted-foreground">
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
                                                                className="inline-flex items-center gap-1 text-blue-900 hover:underline"
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
                                                                className="inline-flex items-center gap-1 text-slate-600 hover:underline"
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
