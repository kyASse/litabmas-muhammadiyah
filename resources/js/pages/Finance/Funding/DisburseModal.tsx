import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/ui/StatusBadge';
import TabularFigure from '@/components/ui/TabularFigure';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { useForm } from '@inertiajs/react';
import { Building2, FileCheck, Lock, Unlock, UploadCloud, User } from 'lucide-react';
import React, { useRef } from 'react';

export interface FundingDisburseTarget {
    id: number;
    termin_ke: number;
    persentase_dana: number;
    nominal_dana: number;
    status_pencairan: string;
    status_label?: string;
    is_monev_approved?: boolean;
    file_tagihan?: string | null;
    nominal_tagihan?: number | null;
    file_presentasi?: string | null;
    tipe_laporan_tagihan?: string | null;
    contract?: {
        id: number;
        nomor_kontrak: string;
        judul_kontrak: string;
        dana_disetujui: number;
        university?: {
            name: string;
            short_name?: string | null;
            code?: string;
        } | null;
        proposal?: {
            id: number;
            judul_penelitian: string;
            pengusul?: {
                name: string;
                email?: string;
            } | null;
        } | null;
    } | null;
}

export interface DisburseModalProps {
    funding: FundingDisburseTarget | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export const DisburseModal: React.FC<DisburseModalProps> = ({ funding, open, onOpenChange, onSuccess }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isTermin2 = funding?.termin_ke === 2;
    const isMonevApproved = Boolean(funding?.is_monev_approved);
    const isLocked = isTermin2 && !isMonevApproved;

    const { data, setData, post, processing, errors, reset } = useForm({
        bukti_transfer: null as File | null,
        tanggal_pencairan: new Date().toISOString().split('T')[0],
        catatan_keuangan: '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setData('bukti_transfer', e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!funding || isLocked) return;

        post(route('finance.funding.disburse', funding.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
                if (onSuccess) onSuccess();
            },
        });
    };

    if (!funding) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl dark:border-slate-800 dark:bg-slate-900">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-3">
                        <DialogTitle className="font-serif text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t.funding.modalTitle}</DialogTitle>
                        <StatusBadge status={isLocked ? 'Monev_Locked' : isTermin2 ? 'Disbursed_T2' : 'Disbursed_T1'} size="sm" />
                    </div>
                    <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">{t.funding.modalSubtitle}</DialogDescription>
                </DialogHeader>

                {/* Info Kontrak & Proposal */}
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                            <span className="font-mono text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                {t.contracts.contractNumber}
                            </span>
                            <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{funding.contract?.nomor_kontrak || '-'}</p>
                            <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                                {funding.contract?.judul_kontrak || funding.contract?.proposal?.judul_penelitian}
                            </p>
                        </div>
                        <div className="shrink-0 text-right">
                            <span className="block font-mono text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                {t.funding.trancheNumber}
                            </span>
                            <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                                {t.funding.trancheLabel.replace('{number}', String(funding.termin_ke))} ({funding.persentase_dana}%)
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-2 text-xs dark:border-slate-800">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{funding.contract?.proposal?.pengusul?.name || '-'}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-slate-600 dark:text-slate-400">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{funding.contract?.university?.short_name || funding.contract?.university?.name || '-'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 dark:border-slate-800">
                        <span className="text-xs font-medium tracking-wider text-slate-600 uppercase dark:text-slate-400">{t.funding.allocatedAmount}</span>
                        <TabularFigure
                            value={funding.nominal_dana}
                            type="currency"
                            size="lg"
                            weight="bold"
                            className="font-semibold text-emerald-700 dark:text-emerald-400"
                        />
                    </div>

                    {funding.file_tagihan && (
                        <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs dark:border-slate-800">
                            <div className="space-y-0.5">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{t.funding.tableColBillingDoc}</span>
                                {funding.nominal_tagihan && (
                                    <div className="font-mono text-xs text-slate-900 dark:text-slate-100">
                                        <TabularFigure value={funding.nominal_tagihan} type="currency" size="sm" weight="semibold" />
                                    </div>
                                )}
                            </div>
                            <a
                                href={`/storage/${funding.file_tagihan}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                <FileCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                <span>{t.funding.viewBillingDoc}</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* Monev Gatekeeper Lock Warning / Indicator */}
                {isLocked ? (
                    <div className="space-y-2 rounded-lg border-2 border-rose-300 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                        <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-rose-800 uppercase dark:text-rose-300">
                            <Lock className="h-4 w-4 shrink-0 text-rose-700 dark:text-rose-400" strokeWidth={2.5} />
                            <span>{t.funding.monevGatekeeperTitle}</span>
                            <span className="ml-auto rounded bg-rose-200 px-2 py-0.5 font-mono text-xs text-rose-800 dark:bg-rose-900 dark:text-rose-200">{t.statuses.Monev_Locked}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">{t.funding.monevLockedNotice}</p>
                        <p className="border-t border-rose-200/60 pt-1 font-mono text-xs text-rose-600 dark:border-rose-900/40 dark:text-rose-400">{t.funding.monevBackendBlockNotice}</p>
                    </div>
                ) : isTermin2 && isMonevApproved ? (
                    <div className="space-y-1 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-800 uppercase dark:text-emerald-300">
                            <Unlock className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" strokeWidth={2} />
                            <span>{t.funding.monevApprovedNotice}</span>
                        </div>
                    </div>
                ) : null}

                {/* Form Pencairan */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid gap-2">
                        <Label htmlFor="tanggal_pencairan" className="text-xs font-medium tracking-wider text-slate-700 uppercase dark:text-slate-300">
                            {t.funding.disbursementDate} <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="tanggal_pencairan"
                            type="date"
                            disabled={isLocked || processing}
                            value={data.tanggal_pencairan}
                            onChange={(e) => setData('tanggal_pencairan', e.target.value)}
                            className="bg-white font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            required
                        />
                        {errors.tanggal_pencairan && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errors.tanggal_pencairan}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bukti_transfer" className="text-xs font-medium tracking-wider text-slate-700 uppercase dark:text-slate-300">
                            {t.funding.proofOfTransfer} <span className="text-rose-500">*</span>
                        </Label>
                        <div className="flex flex-col gap-2">
                            <div
                                onClick={() => !isLocked && !processing && fileInputRef.current?.click()}
                                className={`cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
                                    isLocked
                                        ? 'cursor-not-allowed border-slate-300 bg-slate-100 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
                                        : data.bukti_transfer
                                          ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-800/60 dark:bg-emerald-950/30'
                                          : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    id="bukti_transfer"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    disabled={isLocked || processing}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    {data.bukti_transfer ? (
                                        <>
                                            <FileCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                            <p className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                                                {data.bukti_transfer.name} ({(data.bukti_transfer.size / (1024 * 1024)).toFixed(2)} MB)
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.funding.clickToReplaceFile}</p>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="h-8 w-8 text-slate-400" />
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {isLocked ? t.funding.blockedByMonevGatekeeper : t.funding.clickToSelectProofFile}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.funding.proofFileFormatLimit}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            {errors.bukti_transfer && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errors.bukti_transfer}</p>}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="catatan_keuangan" className="text-xs font-medium tracking-wider text-slate-700 uppercase dark:text-slate-300">
                            {t.funding.notes}
                        </Label>
                        <Textarea
                            id="catatan_keuangan"
                            disabled={isLocked || processing}
                            value={data.catatan_keuangan}
                            onChange={(e) => setData('catatan_keuangan', e.target.value)}
                            placeholder={t.funding.notesPlaceholder}
                            rows={3}
                            className="bg-white text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        {errors.catatan_keuangan && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{errors.catatan_keuangan}</p>}
                    </div>

                    <DialogFooter className="gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                            {t.common.cancel}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLocked || processing || !data.bukti_transfer}
                            className={`font-semibold tracking-wide ${
                                isLocked ? 'cursor-not-allowed bg-slate-400 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                            }`}
                        >
                            {processing ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    {t.funding.btnDisbursing}
                                </span>
                            ) : isLocked ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5" />
                                    {t.statuses.Monev_Locked}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5">
                                    <FileCheck className="h-3.5 w-3.5" />
                                    {t.funding.btnDisburse}
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DisburseModal;
