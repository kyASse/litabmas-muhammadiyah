import React from 'react';
import { 
  FileEdit, Send, Clock, CheckCircle2, XCircle, 
  AlertTriangle, FileCheck, Lock, Unlock, ShieldCheck, 
  Archive, LucideIcon 
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export type BadgeStatusType = 
  | 'Draft' 
  | 'Submitted' 
  | 'In_Review' 
  | 'Lolos_Didanai' 
  | 'Ditolak' 
  | 'Revisi' 
  | 'Contracted' 
  | 'Disbursed_T1' 
  | 'Disbursed_T2' 
  | 'Monev_Approved' 
  | 'Monev_Locked' 
  | 'Output_Verified' 
  | 'Completed_SKTS' 
  | 'Terminated'
  | 'Active'
  | 'Inactive'
  | 'Signed'
  | 'Pending'
  | 'Disbursed'
  | 'Approved'
  | 'Revision'
  | 'Waiting_Disbursement'
  | 'Administrasi_Valid'
  | 'Reviewed'
  | string;

export interface StatusBadgeProps {
  status: BadgeStatusType;
  labelOverride?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  classes: string;
  icon: LucideIcon;
}

export function normalizeStatus(status: string): string {
  const s = (status || '').toLowerCase().trim();
  if (s === 'draft' || s === 'draf') return 'Draft';
  if (s === 'submitted' || s === 'diajukan') return 'Submitted';
  if (s === 'in_review' || s === 'in review' || s === 'sedang direview' || s === 'review' || s === 'reviewed' || s === 'direview') return 'In_Review';
  if (s === 'lolos_didanai' || s === 'lolos didanai' || s === 'funded') return 'Lolos_Didanai';
  if (s === 'ditolak' || s === 'rejected') return 'Ditolak';
  if (s === 'revisi' || s === 'revision' || s === 'perlu revisi') return 'Revisi';
  if (s === 'contracted' || s === 'terkontrak') return 'Contracted';
  if (s === 'disbursed_t1' || s === 'cair termin 1' || s === 'cair_termin_1') return 'Disbursed_T1';
  if (s === 'disbursed_t2' || s === 'cair termin 2' || s === 'cair_termin_2') return 'Disbursed_T2';
  if (s === 'monev_approved' || s === 'monev disetujui') return 'Monev_Approved';
  if (s === 'monev_locked' || s === 'terkunci monev' || s === 'terkunci_monev') return 'Monev_Locked';
  if (s === 'output_verified' || s === 'luaran terverifikasi' || s === 'verified') return 'Output_Verified';
  if (s === 'completed_skts' || s === 'selesai (skts)' || s === 'selesai' || s === 'completed') return 'Completed_SKTS';
  if (s === 'terminated' || s === 'dibatalkan' || s === 'force majeure / dibatalkan') return 'Terminated';
  if (s === 'active' || s === 'aktif') return 'Active';
  if (s === 'inactive' || s === 'tidak aktif' || s === 'nonaktif') return 'Inactive';
  if (s === 'signed' || s === 'ditandatangani') return 'Signed';
  if (s === 'pending' || s === 'menunggu') return 'Pending';
  if (s === 'disbursed' || s === 'dicairkan') return 'Disbursed';
  if (s === 'approved' || s === 'disetujui') return 'Approved';
  if (s === 'administrasi_valid' || s === 'valid administrasi' || s === 'valid_administrasi') return 'Administrasi_Valid';
  if (s === 'lolos_administrasi' || s === 'lolos administrasi') return 'Lolos_Administrasi';
  if (s === 'ditolak_administrasi' || s === 'ditolak administrasi') return 'Ditolak_Administrasi';
  if (s === 'submitted_kampus' || s === 'diajukan ke kampus') return 'Submitted_Kampus';
  if (s === 'approved_kampus' || s === 'disetujui kampus') return 'Approved_Kampus';
  if (s === 'rejected_kampus' || s === 'ditolak kampus') return 'Rejected_Kampus';
  if (s === 'waiting_disbursement' || s === 'menunggu pencairan' || s === 'menunggu_pencairan') return 'Waiting_Disbursement';
  return status;
}

const statusMap: Record<string, StatusConfig> = {
  Draft: {
    label: '[DRAFT]',
    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    icon: FileEdit,
  },
  Submitted: {
    label: '[DIAJUKAN]',
    classes: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    icon: Send,
  },
  In_Review: {
    label: '[SEDANG DIREVIEW]',
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icon: Clock,
  },
  Lolos_Didanai: {
    label: '[LOLOS DIDANAI]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Ditolak: {
    label: '[DITOLAK]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    icon: XCircle,
  },
  Revisi: {
    label: '[PERLU REVISI]',
    classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icon: AlertTriangle,
  },
  Contracted: {
    label: '[TERKONTRAK]',
    classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    icon: FileCheck,
  },
  Disbursed_T1: {
    label: '[CAIR TERMIN 1]',
    classes: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
    icon: CheckCircle2,
  },
  Disbursed_T2: {
    label: '[CAIR TERMIN 2]',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Monev_Approved: {
    label: '[MONEV DISETUJUI]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: Unlock,
  },
  Monev_Locked: {
    label: '[TERKUNCI MONEV]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    icon: Lock,
  },
  Output_Verified: {
    label: '[LUARAN TERVERIFIKASI]',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    icon: ShieldCheck,
  },
  Completed_SKTS: {
    label: '[SELESAI (SKTS)]',
    classes: 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/70',
    icon: Archive,
  },
  Terminated: {
    label: '[FORCE MAJEURE / DIBATALKAN]',
    classes: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    icon: XCircle,
  },
  Active: {
    label: '[ACTIVE]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Inactive: {
    label: '[INACTIVE]',
    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    icon: XCircle,
  },
  Signed: {
    label: '[SIGNED]',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Pending: {
    label: '[PENDING]',
    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    icon: Clock,
  },
  Disbursed: {
    label: '[DISBURSED]',
    classes: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
    icon: CheckCircle2,
  },
  Approved: {
    label: '[APPROVED]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: Unlock,
  },
  Revision: {
    label: '[PERLU REVISI]',
    classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icon: AlertTriangle,
  },
  Waiting_Disbursement: {
    label: '[MENUNGGU PENCAIRAN]',
    classes: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    icon: Clock,
  },
  Administrasi_Valid: {
    label: '[ADMINISTRASI VALID]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Lolos_Administrasi: {
    label: '[LOLOS ADMINISTRASI]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
  },
  Ditolak_Administrasi: {
    label: '[DITOLAK ADMINISTRASI]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    icon: XCircle,
  },
  Submitted_Kampus: {
    label: '[SUBMIT KAMPUS]',
    classes: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    icon: Send,
  },
  Approved_Kampus: {
    label: '[DISETUJUI KAMPUS]',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    icon: ShieldCheck,
  },
  Rejected_Kampus: {
    label: '[DITOLAK KAMPUS]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    icon: XCircle,
  },
  Reviewed: {
    label: '[DIREVIEW]',
    classes: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    icon: CheckCircle2,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  labelOverride,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const normalized = normalizeStatus(status);
  const config = statusMap[normalized] || statusMap[status] || statusMap.Draft;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-xs gap-1.5';

  const localizedLabel =
    (t.statuses && ((t.statuses as any)[normalized] || (t.statuses as any)[status])) ||
    labelOverride ||
    config.label;

  return (
    <span
      className={`inline-flex items-center font-sans font-medium rounded-md border tracking-wide uppercase ${sizeClasses} ${config.classes} ${className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} strokeWidth={2} />}
      <span>{localizedLabel}</span>
    </span>
  );
};

export default StatusBadge;
