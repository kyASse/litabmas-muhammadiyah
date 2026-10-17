import React, { useRef } from 'react';
import { useForm } from '@inertiajs/react';
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
import TabularFigure from '@/components/ui/TabularFigure';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/use-translation';
import { Lock, Unlock, UploadCloud, FileCheck, AlertTriangle, Building2, User, FileText } from 'lucide-react';

export interface FundingDisburseTarget {
    id: number;
    termin_ke: number;
    persentase_dana: number;
    nominal_dana: number;
    status_pencairan: string;
    status_label?: string;
    is_monev_approved?: boolean;
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

export const DisburseModal: React.FC<DisburseModalProps> = ({
    funding,
    open,
    onOpenChange,
    onSuccess,
}) => {
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
            <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-3">
                        <DialogTitle className="text-xl font-serif font-bold text-slate-900 tracking-tight">
                            {t.funding.modalTitle}
                        </DialogTitle>
                        <StatusBadge
                            status={isLocked ? 'Monev_Locked' : isTermin2 ? 'Disbursed_T2' : 'Disbursed_T1'}
                            labelOverride={isLocked ? '[TERKUNCI MONEV]' : `[TERMIN ${funding.termin_ke}]`}
                            size="sm"
                        />
                    </div>
                    <DialogDescription className="text-sm text-slate-600">
                        {t.funding.modalSubtitle}
                    </DialogDescription>
                </DialogHeader>

                {/* Info Kontrak & Proposal */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                            <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
                                {t.contracts.contractNumber}
                            </span>
                            <p className="font-mono text-sm font-semibold text-slate-800">
                                {funding.contract?.nomor_kontrak || '-'}
                            </p>
                            <p className="text-sm font-medium text-slate-900 line-clamp-2">
                                {funding.contract?.judul_kontrak || funding.contract?.proposal?.judul_penelitian}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider block">
                                {t.funding.trancheNumber}
                            </span>
                            <span className="font-mono font-bold text-base text-slate-900">
                                Termin {funding.termin_ke} ({funding.persentase_dana}%)
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{funding.contract?.proposal?.pengusul?.name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 justify-end">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{funding.contract?.university?.short_name || funding.contract?.university?.name || '-'}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                            {t.funding.allocatedAmount}
                        </span>
                        <TabularFigure
                            value={funding.nominal_dana}
                            type="currency"
                            size="lg"
                            weight="bold"
                            className="text-emerald-700 font-semibold"
                        />
                    </div>
                </div>

                {/* Monev Gatekeeper Lock Warning / Indicator */}
                {isLocked ? (
                    <div className="rounded-lg border-2 border-rose-300 bg-rose-50 p-4 space-y-2 text-rose-900">
                        <div className="flex items-center gap-2 font-bold text-rose-800 tracking-wide uppercase text-sm">
                            <Lock className="w-4 h-4 text-rose-700 shrink-0" strokeWidth={2.5} />
                            <span>{t.funding.monevGatekeeperTitle}</span>
                            <span className="ml-auto text-xs px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-mono">
                                [TERKUNCI MONEV]
                            </span>
                        </div>
                        <p className="text-xs leading-relaxed text-rose-700">
                            {t.funding.monevLockedNotice}
                        </p>
                        <p className="text-xs font-mono text-rose-600 pt-1 border-t border-rose-200/60">
                            Pencairan Termin 2 (30%) secara teknis dan bisnis diblokir di level backend (HTTP 422 Unprocessable Content) hingga laporan kemajuan disetujui (Approved) oleh reviewer.
                        </p>
                    </div>
                ) : isTermin2 && isMonevApproved ? (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 space-y-1 text-emerald-900">
                        <div className="flex items-center gap-2 font-semibold text-emerald-800 text-xs tracking-wide uppercase">
                            <Unlock className="w-4 h-4 text-emerald-700 shrink-0" strokeWidth={2} />
                            <span>{t.funding.monevApprovedNotice}</span>
                        </div>
                    </div>
                ) : null}

                {/* Form Pencairan */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid gap-2">
                        <Label htmlFor="tanggal_pencairan" className="text-xs font-medium uppercase tracking-wider text-slate-700">
                            {t.funding.disbursementDate} <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="tanggal_pencairan"
                            type="date"
                            disabled={isLocked || processing}
                            value={data.tanggal_pencairan}
                            onChange={(e) => setData('tanggal_pencairan', e.target.value)}
                            className="bg-white font-mono text-sm"
                            required
                        />
                        {errors.tanggal_pencairan && (
                            <p className="text-xs text-rose-600 font-medium">{errors.tanggal_pencairan}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bukti_transfer" className="text-xs font-medium uppercase tracking-wider text-slate-700">
                            {t.funding.proofOfTransfer} <span className="text-rose-500">*</span>
                        </Label>
                        <div className="flex flex-col gap-2">
                            <div
                                onClick={() => !isLocked && !processing && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                                    isLocked
                                        ? 'bg-slate-100 border-slate-300 cursor-not-allowed opacity-60'
                                        : data.bukti_transfer
                                        ? 'border-emerald-400 bg-emerald-50/50'
                                        : 'border-slate-300 hover:border-slate-400 bg-white'
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
                                            <FileCheck className="w-8 h-8 text-emerald-600" />
                                            <p className="text-xs font-medium font-mono text-slate-800">
                                                {data.bukti_transfer.name} ({(data.bukti_transfer.size / (1024 * 1024)).toFixed(2)} MB)
                                            </p>
                                            <p className="text-xs text-slate-500">Klik untuk mengganti berkas</p>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 text-slate-400" />
                                            <p className="text-xs font-medium text-slate-700">
                                                {isLocked ? '[DIBLOKIR GEMBOK MONEV]' : 'Klik untuk memilih berkas bukti transfer'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Format PDF, JPG, PNG (Maksimal 10 MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            {errors.bukti_transfer && (
                                <p className="text-xs text-rose-600 font-medium">{errors.bukti_transfer}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="catatan_keuangan" className="text-xs font-medium uppercase tracking-wider text-slate-700">
                            {t.funding.notes}
                        </Label>
                        <Textarea
                            id="catatan_keuangan"
                            disabled={isLocked || processing}
                            value={data.catatan_keuangan}
                            onChange={(e) => setData('catatan_keuangan', e.target.value)}
                            placeholder={t.funding.notesPlaceholder}
                            rows={3}
                            className="bg-white text-sm"
                        />
                        {errors.catatan_keuangan && (
                            <p className="text-xs text-rose-600 font-medium">{errors.catatan_keuangan}</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLocked || processing || !data.bukti_transfer}
                            className={`font-semibold tracking-wide ${
                                isLocked ? 'bg-slate-400 cursor-not-allowed hover:bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'
                            }`}
                        >
                            {processing ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t.funding.btnDisbursing}
                                </span>
                            ) : isLocked ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5" />
                                    [TERKUNCI MONEV]
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5">
                                    <FileCheck className="w-3.5 h-3.5" />
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
