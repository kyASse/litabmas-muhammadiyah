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
  | 'Terminated';

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

const statusMap: Record<BadgeStatusType, StatusConfig> = {
  Draft: {
    label: '[DRAFT]',
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: FileEdit,
  },
  Submitted: {
    label: '[DIAJUKAN]',
    classes: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Send,
  },
  In_Review: {
    label: '[SEDANG DIREVIEW]',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  Lolos_Didanai: {
    label: '[LOLOS DIDANAI]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  Ditolak: {
    label: '[DITOLAK]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
  Revisi: {
    label: '[PERLU REVISI]',
    classes: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: AlertTriangle,
  },
  Contracted: {
    label: '[TERKONTRAK]',
    classes: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: FileCheck,
  },
  Disbursed_T1: {
    label: '[CAIR TERMIN 1]',
    classes: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: CheckCircle2,
  },
  Disbursed_T2: {
    label: '[CAIR TERMIN 2]',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: CheckCircle2,
  },
  Monev_Approved: {
    label: '[MONEV DISETUJUI]',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Unlock,
  },
  Monev_Locked: {
    label: '[TERKUNCI MONEV]',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Lock,
  },
  Output_Verified: {
    label: '[LUARAN TERVERIFIKASI]',
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: ShieldCheck,
  },
  Completed_SKTS: {
    label: '[SELESAI (SKTS)]',
    classes: 'bg-slate-900 text-white border-slate-900',
    icon: Archive,
  },
  Terminated: {
    label: '[FORCE MAJEURE / DIBATALKAN]',
    classes: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: XCircle,
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
  const config = statusMap[status] || statusMap.Draft;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-xs gap-1.5';

  const localizedLabel = labelOverride || (t.statuses && t.statuses[status]) || config.label;

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
