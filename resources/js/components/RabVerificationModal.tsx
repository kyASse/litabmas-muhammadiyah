/**
 * RabVerificationModal Component
 *
 * @description
 * Komponen modal dialog audit kepatuhan anggaran (RAB) oleh Admin Keuangan Bappeda (Fase 1).
 * Menggunakan standar desain Scholarly Enterprise berbasis shadcn/ui dan UI/UX Pro Max,
 * memvalidasi kesesuaian pos belanja terhadap Standar Biaya Masukan (SBM) Kota Yogyakarta.
 * Bebas 100% dari simbol emoji.
 */

import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from '@/hooks/use-translation';
import { formatCurrency } from '@/lib/format';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Calculator,
    Info,
    ReceiptText,
} from 'lucide-react';

interface RabVerificationModalProps {
    proposalId: number;
    proposalTitle: string;
    proposedBudget: number;
    schemeMaxBudget?: number;
    initialRekomendasiAnggaran?: number | null;
    initialCatatanKeuangan?: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function RabVerificationModal({
    proposalId,
    proposalTitle,
    proposedBudget,
    schemeMaxBudget,
    initialRekomendasiAnggaran,
    initialCatatanKeuangan,
    isOpen,
    onClose,
}: RabVerificationModalProps) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors, reset } = useForm({
        status_rab: 'Approved' as 'Approved' | 'Rejected',
        rekomendasi_anggaran: initialRekomendasiAnggaran ? String(initialRekomendasiAnggaran) : String(proposedBudget),
        catatan_keuangan: initialCatatanKeuangan || '',
    });

    const isApprove = data.status_rab === 'Approved';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('finance.proposals.verify-rab', { proposal: proposalId }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-serif">
                                {t.rabVerificationModal.title}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                {t.rabVerificationModal.subtitle}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Proposal Summary Card */}
                    <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t.financeProposals.proposalInfoCard}
                        </div>
                        <div className="text-sm font-medium text-foreground line-clamp-2">
                            {proposalTitle}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-1 border-t border-border/60">
                            <div>
                                <span className="text-xs text-muted-foreground block">
                                    {t.rabVerificationModal.proposedBudget}
                                </span>
                                <span className="font-mono text-sm font-semibold text-foreground">
                                    {formatCurrency(proposedBudget)}
                                </span>
                            </div>
                            {schemeMaxBudget ? (
                                <div>
                                    <span className="text-xs text-muted-foreground block">
                                        {t.rabVerificationModal.schemeMaxBudget}
                                    </span>
                                    <span className="font-mono text-sm font-semibold text-muted-foreground">
                                        {formatCurrency(schemeMaxBudget)}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* SBM Notice Alert */}
                    <Alert className="border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertTitle className="text-xs font-semibold">
                            {t.rabVerificationModal.sbmWarningTitle}
                        </AlertTitle>
                        <AlertDescription className="text-xs text-blue-800/90 dark:text-blue-300/90 mt-0.5">
                            {t.rabVerificationModal.sbmWarningBody}
                        </AlertDescription>
                    </Alert>

                    {/* Decision Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-foreground">
                            {t.rabVerificationModal.decisionLabel}
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setData('status_rab', 'Approved')}
                                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                                    isApprove
                                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                                        : 'border-border bg-card hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <CheckCircle2 className={`h-4 w-4 shrink-0 ${isApprove ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                <div className="text-xs font-medium leading-snug">
                                    {t.rabVerificationModal.decisionApprove}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setData('status_rab', 'Rejected')}
                                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                                    !isApprove
                                        ? 'border-destructive bg-destructive/10 text-destructive dark:text-red-300 ring-2 ring-destructive/20'
                                        : 'border-border bg-card hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <XCircle className={`h-4 w-4 shrink-0 ${!isApprove ? 'text-destructive' : 'text-muted-foreground'}`} />
                                <div className="text-xs font-medium leading-snug">
                                    {t.rabVerificationModal.decisionReject}
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Recommended Budget Input (Only if Approved) */}
                    {isApprove && (
                        <div className="space-y-1.5">
                            <Label htmlFor="rekomendasi_anggaran" className="text-xs font-semibold text-foreground">
                                {t.rabVerificationModal.recommendedBudget}
                            </Label>
                            <Input
                                id="rekomendasi_anggaran"
                                type="number"
                                min="0"
                                step="1000"
                                value={data.rekomendasi_anggaran}
                                onChange={(e) => setData('rekomendasi_anggaran', e.target.value)}
                                placeholder={t.rabVerificationModal.recommendedBudgetPlaceholder}
                                className="font-mono text-sm"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                {t.rabVerificationModal.recommendedBudgetHelp}
                            </p>
                            {errors.rekomendasi_anggaran && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {errors.rekomendasi_anggaran}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Finance Notes Textarea */}
                    <div className="space-y-1.5">
                        <Label htmlFor="catatan_keuangan" className="text-xs font-semibold text-foreground">
                            {t.rabVerificationModal.notesLabel} {!isApprove && <span className="text-destructive">*</span>}
                        </Label>
                        <Textarea
                            id="catatan_keuangan"
                            rows={3}
                            value={data.catatan_keuangan}
                            onChange={(e) => setData('catatan_keuangan', e.target.value)}
                            placeholder={t.rabVerificationModal.notesPlaceholder}
                            className="text-xs"
                            required={!isApprove}
                        />
                        {errors.catatan_keuangan && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {errors.catatan_keuangan}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                            className="text-xs"
                        >
                            {t.rabVerificationModal.cancelBtn}
                        </Button>
                        <Button
                            type="submit"
                            variant={isApprove ? 'default' : 'destructive'}
                            disabled={processing}
                            className="text-xs gap-1.5"
                        >
                            {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {processing ? t.rabVerificationModal.processing : t.rabVerificationModal.submitBtn}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
