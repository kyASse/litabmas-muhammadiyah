/**
 * AdminVerificationModal Component
 *
 * @description
 * Komponen modal dialog verifikasi seleksi administrasi dinamis Bappeda (Fase 1).
 * Dibangun menggunakan shadcn/ui (Dialog, Table, Alert, Button, Textarea) dan
 * panduan UI/UX Pro Max untuk memberikan umpan balik evaluasi checklist 100% Ya
 * secara reaktif dan terstruktur, bebas dari simbol emoji.
 */

import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from '@/hooks/use-translation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ShieldCheck, FileCheck } from 'lucide-react';

export interface AdminCriterionItem {
    id: number;
    nama_kriteria: string;
    deskripsi?: string | null;
    tipe_jawaban: string;
    urutan: number;
}

interface AdminVerificationModalProps {
    proposalId: number;
    proposalTitle: string;
    adminCriteria: AdminCriterionItem[];
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminVerificationModal({
    proposalId,
    proposalTitle,
    adminCriteria = [],
    isOpen,
    onClose,
}: AdminVerificationModalProps) {
    const { t } = useTranslation();

    // Inisialisasi checklist: default nilai true (Memenuhi) untuk setiap butir kriteria aktif
    const initialChecklist = React.useMemo(() => {
        const init: Record<number, boolean> = {};
        adminCriteria.forEach((crit) => {
            init[crit.id] = true;
        });
        return init;
    }, [adminCriteria]);

    const { data, setData, post, processing, errors, reset } = useForm({
        checklist: initialChecklist,
        catatan_administrasi: '',
    });

    useEffect(() => {
        if (isOpen) {
            setData({
                checklist: initialChecklist,
                catatan_administrasi: '',
            });
        }
    }, [isOpen, initialChecklist]);

    // Evaluasi apakah seluruh butir bernilai true (100% Ya)
    const allPassed = React.useMemo(() => {
        if (adminCriteria.length === 0) return true;
        return adminCriteria.every((crit) => Boolean(data.checklist[crit.id]));
    }, [adminCriteria, data.checklist]);

    const handleToggleCriterion = (criterionId: number, value: boolean) => {
        setData('checklist', {
            ...data.checklist,
            [criterionId]: value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.proposals.verify-administration', { proposal: proposalId }), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-sidebar-border bg-white p-6 shadow-2xl dark:bg-neutral-950 dark:border-neutral-800">
                <DialogHeader className="border-b border-sidebar-border/60 pb-4 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-400">
                        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                            <FileCheck className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {t.adminVerification.modalTitle}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                {t.adminVerification.modalSubtitle}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-neutral-900 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">Usulan Penelitian:</span> {proposalTitle}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-3">
                    {/* Tabel Butir Kriteria Dinamis */}
                    {adminCriteria.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/60 dark:border-neutral-800">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="border-b border-sidebar-border/60 bg-neutral-50/70 hover:bg-neutral-50/70 dark:bg-neutral-900/50">
                                        <TableHead className="w-[50px] text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {t.adminVerification.criteriaColNo}
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {t.adminVerification.criteriaColName}
                                        </TableHead>
                                        <TableHead className="w-[180px] text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {t.adminVerification.criteriaColStatus}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adminCriteria.map((item, idx) => {
                                        const isChecked = Boolean(data.checklist[item.id]);
                                        return (
                                            <TableRow
                                                key={item.id}
                                                className={`transition-colors border-b border-sidebar-border/40 dark:border-neutral-800/60 ${
                                                    isChecked
                                                        ? 'hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
                                                        : 'bg-rose-50/40 hover:bg-rose-50/60 dark:bg-rose-950/30 dark:hover:bg-rose-950/40'
                                                }`}
                                            >
                                                <TableCell className="text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                                        {item.nama_kriteria}
                                                    </div>
                                                    {item.deskripsi && (
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                            {item.deskripsi}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center py-3">
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-sidebar-border/60 bg-slate-100/80 p-1 dark:bg-neutral-900 dark:border-neutral-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCriterion(item.id, true)}
                                                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                                                isChecked
                                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                                    : 'text-slate-600 hover:text-emerald-700 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            {t.adminVerification.statusYes}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCriterion(item.id, false)}
                                                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                                                !isChecked
                                                                    ? 'bg-rose-600 text-white shadow-sm'
                                                                    : 'text-slate-600 hover:text-rose-700 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            {t.adminVerification.statusNo}
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-sidebar-border p-4 text-center dark:border-neutral-800">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {t.adminVerification.noCriteriaTitle}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {t.adminVerification.noCriteriaDesc}
                            </p>
                        </div>
                    )}

                    {/* Banner Ringkasan Kelulusan Reaktif */}
                    {allPassed ? (
                        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            <AlertTitle className="font-semibold text-sm">
                                {t.adminVerification.summaryTitlePassed}
                            </AlertTitle>
                            <AlertDescription className="text-xs mt-1 text-emerald-800 dark:text-emerald-300">
                                {t.adminVerification.summaryDescPassed}
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                            <AlertTitle className="font-semibold text-sm">
                                {t.adminVerification.summaryTitleFailed}
                            </AlertTitle>
                            <AlertDescription className="text-xs mt-1 text-rose-800 dark:text-rose-300">
                                {t.adminVerification.summaryDescFailed}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Field Catatan Telaah Administrasi */}
                    <div className="space-y-1.5">
                        <Label htmlFor="catatan_administrasi" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {t.adminVerification.notesLabel} {!allPassed && <span className="text-rose-500">*</span>}
                        </Label>
                        <Textarea
                            id="catatan_administrasi"
                            rows={3}
                            placeholder={t.adminVerification.notesPlaceholder}
                            value={data.catatan_administrasi}
                            onChange={(e) => setData('catatan_administrasi', e.target.value)}
                            className="border-sidebar-border text-sm dark:border-neutral-800"
                        />
                        {!allPassed && !data.catatan_administrasi.trim() && (
                            <p className="text-[11px] text-rose-600 dark:text-rose-400">
                                {t.adminVerification.notesRequiredForRejection}
                            </p>
                        )}
                        {errors.catatan_administrasi && (
                            <p className="text-xs text-rose-600">{errors.catatan_administrasi}</p>
                        )}
                    </div>

                    {/* Footer Dialog */}
                    <DialogFooter className="border-t border-sidebar-border/60 pt-4 dark:border-neutral-800 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                            className="text-xs font-semibold"
                        >
                            {t.adminVerification.btnCancel}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || (!allPassed && !data.catatan_administrasi.trim())}
                            className={`gap-1.5 text-xs font-semibold text-white ${
                                allPassed
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    {t.adminVerification.loading}
                                </>
                            ) : allPassed ? (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {t.adminVerification.btnSubmitPassed}
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-3.5 w-3.5" />
                                    {t.adminVerification.btnSubmitFailed}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
