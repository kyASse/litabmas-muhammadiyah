import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  UserCheck,
  Calendar,
  Coins,
  ShieldCheck,
  Info,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/ui/PageHeader';
import TabularFigure from '@/components/ui/TabularFigure';
import PDFUploader from '@/components/ui/PDFUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/use-translation';
import { BreadcrumbItem, SharedData } from '@/types';
import { route } from 'ziggy-js';
import { toast } from 'sonner';

export interface SchemaItem {
  id: number;
  nama_skema?: string;
  name?: string;
  deskripsi?: string | null;
  description?: string | null;
  biaya_maksimal?: number;
  max_funding?: number;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  is_active?: boolean;
}

export interface LecturerItem {
  id: number;
  name: string;
  email: string;
  nidn?: string | null;
  study_program?: string | null;
}

export interface WizardProps {
  schemas?: SchemaItem[];
  lecturers?: LecturerItem[];
}

export interface RabItem {
  id: string;
  kategori: string;
  deskripsi: string;
  volume: number;
  biaya_satuan: number;
}

export interface TeamMember {
  user_id: number;
  peran: string;
  alokasi_jam_per_minggu: number;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Usulan Riset', href: '/proposals' },
  { title: 'Formulir Pengajuan Terpadu', href: '/proposals/create' },
];

export default function Wizard({ schemas = [], lecturers = [] }: WizardProps) {
  const { t, format, locale } = useTranslation();
  const pageProps = usePage<SharedData>().props;
  const currentUser = pageProps.auth?.user;

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [integrityAgreed, setIntegrityAgreed] = useState<boolean>(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const { data, setData, post, processing, errors, isDirty, transform } = useForm({
    id_skema_pendanaan: '',
    judul_penelitian: '',
    abstrak: '',
    latar_belakang: '',
    biaya_yang_diusulkan: 0,
    action: 'submit' as 'submit' | 'draft',
    file_dokumen_proposal: null as File | null,
    members: [] as TeamMember[],
  });

  // Local state for interactive tabular budget items
  const [rabItems, setRabItems] = useState<RabItem[]>([
    {
      id: '1',
      kategori: 'Bahan Habis Pakai',
      deskripsi: '',
      volume: 1,
      biaya_satuan: 0,
    },
  ]);

  // Derived grand total of RAB
  const grandTotal = useMemo(() => {
    return rabItems.reduce((acc, item) => {
      const vol = Number(item.volume) || 0;
      const cost = Number(item.biaya_satuan) || 0;
      return acc + vol * cost;
    }, 0);
  }, [rabItems]);

  // Keep biaya_yang_diusulkan in sync with grand total
  useEffect(() => {
    setData('biaya_yang_diusulkan', grandTotal);
  }, [grandTotal]);

  // Currently selected schema
  const selectedSchema = useMemo(() => {
    if (!data.id_skema_pendanaan) return null;
    return schemas.find((s) => String(s.id) === String(data.id_skema_pendanaan)) || null;
  }, [data.id_skema_pendanaan, schemas]);

  // Max funding of selected schema
  const schemaMaxBudget = useMemo(() => {
    if (!selectedSchema) return 0;
    return selectedSchema.biaya_maksimal ?? selectedSchema.max_funding ?? 0;
  }, [selectedSchema]);

  const isPaguExceeded = useMemo(() => {
    if (schemaMaxBudget <= 0) return false;
    return grandTotal > schemaMaxBudget;
  }, [grandTotal, schemaMaxBudget]);

  // Protect against accidental navigation when form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Step validation
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!data.id_skema_pendanaan) {
        newErrors.id_skema_pendanaan = t.proposalWizard.step1.schemaPlaceholder;
      }
      if (!data.judul_penelitian.trim()) {
        newErrors.judul_penelitian = t.proposalWizard.step1.researchTitlePlaceholder;
      }
      if (data.abstrak.trim().length < 100) {
        newErrors.abstrak = format(t.proposalWizard.step1.abstractMinWarning, {
          remaining: Math.max(0, 100 - data.abstrak.trim().length),
        });
      }
    } else if (stepNumber === 2) {
      data.members.forEach((member, index) => {
        if (!member.user_id) {
          newErrors[`member_${index}_user`] = t.proposalWizard.step2.selectMemberPrompt;
        }
        if (!member.alokasi_jam_per_minggu || member.alokasi_jam_per_minggu <= 0) {
          newErrors[`member_${index}_hours`] = t.proposalWizard.step2.hoursPlaceholder;
        }
      });
    } else if (stepNumber === 3) {
      if (rabItems.length === 0) {
        newErrors.rab = t.proposalWizard.step3.emptyRab;
      } else {
        rabItems.forEach((item, index) => {
          if (!item.deskripsi.trim()) {
            newErrors[`rab_${index}_desc`] = t.proposalWizard.step3.descPlaceholder;
          }
          if (!item.biaya_satuan || item.biaya_satuan <= 0) {
            newErrors[`rab_${index}_cost`] = t.proposalWizard.step3.unitCostPlaceholder;
          }
        });
      }
      if (isPaguExceeded) {
        newErrors.pagu = format(t.proposalWizard.step3.paguExceededWarning, {
          excess: new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'id-ID').format(
            grandTotal - schemaMaxBudget
          ),
        });
      }
    } else if (stepNumber === 4) {
      if (!data.file_dokumen_proposal) {
        newErrors.file_dokumen_proposal = t.components.pdfUploader.helperText;
      }
      if (!integrityAgreed) {
        newErrors.integrity = t.proposalWizard.step4.integrityRequiredHint;
      }
    }

    setStepErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      const targetElement = document.getElementById(firstKey);
      if (targetElement) {
        targetElement.focus();
      }
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setStepErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddMember = () => {
    const unselectedLecturer = lecturers.find(
      (l) =>
        l.id !== currentUser?.id &&
        !data.members.some((m) => m.user_id === l.id)
    );

    setData('members', [
      ...data.members,
      {
        user_id: unselectedLecturer ? unselectedLecturer.id : 0,
        peran: 'Anggota Peneliti',
        alokasi_jam_per_minggu: 10,
      },
    ]);
  };

  const handleRemoveMember = (index: number) => {
    const updated = [...data.members];
    updated.splice(index, 1);
    setData('members', updated);
  };

  const handleUpdateMember = (
    index: number,
    field: keyof TeamMember,
    val: string | number
  ) => {
    const updated = [...data.members];
    updated[index] = {
      ...updated[index],
      [field]: field === 'alokasi_jam_per_minggu' || field === 'user_id' ? Number(val) : val,
    };
    setData('members', updated);
  };

  const handleAddRabItem = () => {
    setRabItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        kategori: 'Bahan Habis Pakai',
        deskripsi: '',
        volume: 1,
        biaya_satuan: 0,
      },
    ]);
  };

  const handleRemoveRabItem = (index: number) => {
    if (rabItems.length <= 1) return;
    setRabItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateRabItem = (
    index: number,
    field: keyof RabItem,
    val: string | number
  ) => {
    setRabItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]:
          field === 'volume' || field === 'biaya_satuan' ? Number(val) || 0 : val,
      };
      return next;
    });
  };

  const handleSubmit = (actionType: 'draft' | 'submit') => {
    if (actionType === 'submit') {
      if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
        toast.error(t.proposalWizard.nav.validationFixBeforeNext);
        return;
      }
      if (!confirm(t.proposalWizard.nav.confirmSubmitText)) {
        return;
      }
    }

    transform((formData) => ({
      ...formData,
      action: actionType,
      biaya_yang_diusulkan: grandTotal,
      title: formData.judul_penelitian,
      description: formData.abstrak,
      research_schema_id: formData.id_skema_pendanaan,
    }));

    post(route('proposal.store'), {
      preserveScroll: true,
      onSuccess: () => {
        if (actionType === 'draft') {
          setLastSavedTime(new Date().toLocaleTimeString());
          toast.success(t.proposalWizard.nav.draftSavedIndicator);
        }
      },
    });
  };

  const stepsList = [
    {
      num: 1,
      title: t.proposalWizard.steps.step1.title,
      description: t.proposalWizard.steps.step1.description,
    },
    {
      num: 2,
      title: t.proposalWizard.steps.step2.title,
      description: t.proposalWizard.steps.step2.description,
    },
    {
      num: 3,
      title: t.proposalWizard.steps.step3.title,
      description: t.proposalWizard.steps.step3.description,
    },
    {
      num: 4,
      title: t.proposalWizard.steps.step4.title,
      description: t.proposalWizard.steps.step4.description,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t.proposalWizard.pageTitle} />

      <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8 pb-24">
        {/* Page Header */}
        <PageHeader
          title={t.proposalWizard.pageTitle}
          subtitle={t.proposalWizard.pageSubtitle}
          isEditorialSerif={true}
        />

        {/* 4-Step Stepper */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stepsList.map((step) => {
              const isCurrent = currentStep === step.num;
              const isPast = currentStep > step.num;

              return (
                <button
                  key={step.num}
                  type="button"
                  disabled={!isPast && currentStep !== step.num}
                  onClick={() => isPast && setCurrentStep(step.num)}
                  className={`flex items-start space-x-3 rounded-lg p-3 text-left transition-all ${
                    isCurrent
                      ? 'border-2 border-blue-900 bg-blue-50/50 shadow-2xs'
                      : isPast
                      ? 'border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer'
                      : 'border border-dashed border-slate-200 bg-white opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-mono font-bold transition-colors ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : step.num}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-sans uppercase tracking-wider ${
                        isCurrent
                          ? 'font-bold text-blue-950'
                          : isPast
                          ? 'font-semibold text-slate-800'
                          : 'font-medium text-slate-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 1: Identitas Usulan & Skema Riset */}
        {currentStep === 1 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="font-serif text-xl font-semibold text-slate-900">
                {t.proposalWizard.step1.title}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t.proposalWizard.step1.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Skema Pendanaan */}
              <div className="space-y-2">
                <Label htmlFor="id_skema_pendanaan" className="font-semibold text-slate-800">
                  {t.proposalWizard.step1.schemaLabel} <span className="text-rose-600">*</span>
                </Label>
                <Select
                  value={data.id_skema_pendanaan}
                  onValueChange={(val) => {
                    setData('id_skema_pendanaan', val);
                    if (stepErrors.id_skema_pendanaan) {
                      setStepErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.id_skema_pendanaan;
                        return copy;
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    id="id_skema_pendanaan"
                    className={
                      stepErrors.id_skema_pendanaan || errors.id_skema_pendanaan
                        ? 'border-rose-500 bg-rose-50/20'
                        : 'border-slate-300'
                    }
                  >
                    <SelectValue placeholder={t.proposalWizard.step1.schemaPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {schemas.length > 0 ? (
                      schemas.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.nama_skema || s.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {t.proposalWizard.step1.noActiveSchemas}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {(stepErrors.id_skema_pendanaan || errors.id_skema_pendanaan) && (
                  <p className="text-xs font-medium text-rose-600">
                    {stepErrors.id_skema_pendanaan || errors.id_skema_pendanaan}
                  </p>
                )}

                {/* Selected Schema Overview Banner */}
                {selectedSchema && (
                  <div className="mt-2.5 rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-blue-900" />
                        <span className="font-medium text-slate-600">
                          {t.proposalWizard.step1.schemaMaxBudget}
                        </span>
                        <TabularFigure
                          value={selectedSchema.biaya_maksimal ?? selectedSchema.max_funding}
                          type="currency"
                          weight="bold"
                        />
                      </div>
                      {selectedSchema.tanggal_selesai && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-900" />
                          <span className="font-medium text-slate-600">
                            {t.proposalWizard.step1.schemaDeadline}
                          </span>
                          <span className="font-mono font-medium text-slate-900">
                            {selectedSchema.tanggal_selesai}
                          </span>
                        </div>
                      )}
                    </div>
                    {(selectedSchema.deskripsi || selectedSchema.description) && (
                      <p className="mt-2 text-slate-600 border-t border-blue-100 pt-2">
                        {selectedSchema.deskripsi || selectedSchema.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Judul Penelitian */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="judul_penelitian" className="font-semibold text-slate-800">
                    {t.proposalWizard.step1.researchTitleLabel}{' '}
                    <span className="text-rose-600">*</span>
                  </Label>
                  <span className="text-xs font-mono text-slate-500">
                    {format(t.proposalWizard.step1.titleCharCount, {
                      count: data.judul_penelitian.length,
                    })}
                  </span>
                </div>
                <Input
                  id="judul_penelitian"
                  maxLength={255}
                  placeholder={t.proposalWizard.step1.researchTitlePlaceholder}
                  value={data.judul_penelitian}
                  onChange={(e) => {
                    setData('judul_penelitian', e.target.value);
                    if (stepErrors.judul_penelitian) {
                      setStepErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.judul_penelitian;
                        return copy;
                      });
                    }
                  }}
                  className={`text-base font-serif ${
                    stepErrors.judul_penelitian || errors.judul_penelitian
                      ? 'border-rose-500 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                />
                {(stepErrors.judul_penelitian || errors.judul_penelitian) && (
                  <p className="text-xs font-medium text-rose-600">
                    {stepErrors.judul_penelitian || errors.judul_penelitian}
                  </p>
                )}
              </div>

              {/* Abstrak */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="abstrak" className="font-semibold text-slate-800">
                    {t.proposalWizard.step1.abstractLabel} <span className="text-rose-600">*</span>
                  </Label>
                  <span
                    className={`text-xs font-mono ${
                      data.abstrak.length < 100 ? 'text-amber-600 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {format(t.proposalWizard.step1.abstractCharCount, {
                      count: data.abstrak.length,
                    })}
                  </span>
                </div>
                <Textarea
                  id="abstrak"
                  rows={6}
                  placeholder={t.proposalWizard.step1.abstractPlaceholder}
                  value={data.abstrak}
                  onChange={(e) => {
                    setData('abstrak', e.target.value);
                    if (stepErrors.abstrak) {
                      setStepErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.abstrak;
                        return copy;
                      });
                    }
                  }}
                  className={`leading-relaxed ${
                    stepErrors.abstrak || errors.abstrak
                      ? 'border-rose-500 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                />
                {(stepErrors.abstrak || errors.abstrak) && (
                  <p className="text-xs font-medium text-rose-600">
                    {stepErrors.abstrak || errors.abstrak}
                  </p>
                )}
              </div>

              {/* Latar Belakang Narrative */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="latar_belakang" className="font-semibold text-slate-800">
                    {t.proposalWizard.step1.backgroundLabel}
                  </Label>
                  <span className="text-xs text-slate-500">
                    {t.proposalWizard.step1.backgroundHelp}
                  </span>
                </div>
                <Textarea
                  id="latar_belakang"
                  rows={4}
                  placeholder={t.proposalWizard.step1.backgroundPlaceholder}
                  value={data.latar_belakang}
                  onChange={(e) => setData('latar_belakang', e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Tim Dosen Peneliti */}
        {currentStep === 2 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-xl font-semibold text-slate-900">
                    {t.proposalWizard.step2.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {t.proposalWizard.step2.subtitle}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMember}
                  className="border-blue-900 text-blue-900 hover:bg-blue-50 font-sans font-semibold text-xs"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t.proposalWizard.step2.addMemberBtn}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* CoI Guard notice banner */}
              <div className="flex items-start space-x-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <p>{t.proposalWizard.step2.coiNotice}</p>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 uppercase text-slate-700 font-mono tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5 w-12 text-center">
                        {t.proposalWizard.step2.tableNo}
                      </th>
                      <th className="px-3.5 py-2.5">{t.proposalWizard.step2.tableName}</th>
                      <th className="px-3.5 py-2.5">{t.proposalWizard.step2.tableNidn}</th>
                      <th className="px-3.5 py-2.5 w-44">{t.proposalWizard.step2.tableRole}</th>
                      <th className="px-3.5 py-2.5 w-28 text-center">
                        {t.proposalWizard.step2.tableHours}
                      </th>
                      <th className="px-3.5 py-2.5 w-20 text-center">
                        {t.proposalWizard.step2.tableActions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {/* Fixed Principal Investigator (Lead) Row */}
                    <tr className="bg-blue-50/30">
                      <td className="px-3.5 py-3 text-center font-mono font-bold text-slate-700">
                        1
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-blue-900" />
                          <span>{currentUser?.name || 'Ketua Pengusul'}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {currentUser?.email}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-slate-600">
                        {(currentUser as any)?.nidn || (currentUser as any)?.study_program || '-'}
                      </td>
                      <td className="px-3.5 py-3 font-medium text-slate-800">
                        <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-900 font-mono">
                          {t.proposalWizard.step2.leaderFixedBadge}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-center font-mono text-slate-700">20</td>
                      <td className="px-3.5 py-3 text-center text-slate-400 font-mono text-[11px]">
                        -
                      </td>
                    </tr>

                    {/* Co-Researchers Dynamic Rows */}
                    {data.members.map((member, index) => {
                      const userError = stepErrors[`member_${index}_user`];
                      const hoursError = stepErrors[`member_${index}_hours`];

                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-3 text-center font-mono text-slate-600">
                            {index + 2}
                          </td>
                          <td className="px-3.5 py-3" colSpan={2}>
                            <Select
                              value={member.user_id ? String(member.user_id) : ''}
                              onValueChange={(val) =>
                                handleUpdateMember(index, 'user_id', Number(val))
                              }
                            >
                              <SelectTrigger
                                className={`h-8 text-xs ${
                                  userError ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                                }`}
                              >
                                <SelectValue
                                  placeholder={t.proposalWizard.step2.selectMemberPrompt}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {lecturers.map((lecturer) => (
                                  <SelectItem
                                    key={lecturer.id}
                                    value={String(lecturer.id)}
                                    disabled={
                                      lecturer.id === currentUser?.id ||
                                      data.members.some(
                                        (m, mIdx) => mIdx !== index && m.user_id === lecturer.id
                                      )
                                    }
                                  >
                                    {lecturer.name}{' '}
                                    {lecturer.nidn ? `(${lecturer.nidn})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {userError && (
                              <p className="mt-1 text-[11px] font-medium text-rose-600">
                                {userError}
                              </p>
                            )}
                          </td>
                          <td className="px-3.5 py-3">
                            <Select
                              value={member.peran}
                              onValueChange={(val) => handleUpdateMember(index, 'peran', val)}
                            >
                              <SelectTrigger className="h-8 text-xs border-slate-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Anggota Peneliti">
                                  {t.proposalWizard.step2.roleOptions.coInvestigator}
                                </SelectItem>
                                <SelectItem value="Spesialis Lapangan">
                                  {t.proposalWizard.step2.roleOptions.fieldSpecialist}
                                </SelectItem>
                                <SelectItem value="Analis Data">
                                  {t.proposalWizard.step2.roleOptions.dataAnalyst}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              value={member.alokasi_jam_per_minggu}
                              onChange={(e) =>
                                handleUpdateMember(
                                  index,
                                  'alokasi_jam_per_minggu',
                                  e.target.value
                                )
                              }
                              className={`h-8 w-20 mx-auto text-center font-mono text-xs ${
                                hoursError ? 'border-rose-500' : 'border-slate-300'
                              }`}
                            />
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(index)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                              title={t.proposalWizard.step2.removeMemberTooltip}
                            >
                              <Trash2 className="h-4 w-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Rencana Anggaran Biaya (RAB) Tabular */}
        {currentStep === 3 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-xl font-semibold text-slate-900">
                    {t.proposalWizard.step3.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {t.proposalWizard.step3.subtitle}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRabItem}
                  className="border-blue-900 text-blue-900 hover:bg-blue-50 font-sans font-semibold text-xs"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t.proposalWizard.step3.addItemBtn}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Pagu validation banner */}
              {isPaguExceeded ? (
                <div className="flex items-start space-x-2.5 rounded-lg border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-800">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {format(t.proposalWizard.step3.paguExceededWarning, {
                        excess: new Intl.NumberFormat(
                          locale === 'en' ? 'en-US' : 'id-ID'
                        ).format(grandTotal - schemaMaxBudget),
                      })}
                    </p>
                    <p className="mt-0.5 text-rose-700">
                      {t.proposalWizard.step3.schemaPaguLabel}{' '}
                      <TabularFigure value={schemaMaxBudget} type="currency" weight="bold" />
                    </p>
                  </div>
                </div>
              ) : (
                selectedSchema &&
                schemaMaxBudget > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800">
                    <span className="font-medium font-mono">
                      {t.proposalWizard.step3.paguValidNotice}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-600">{t.proposalWizard.step3.schemaPaguLabel}</span>
                      <TabularFigure value={schemaMaxBudget} type="currency" weight="bold" />
                    </div>
                  </div>
                )
              )}

              {/* RAB Items Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 uppercase text-slate-700 font-mono tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5 w-48">{t.proposalWizard.step3.colCategory}</th>
                      <th className="px-3.5 py-2.5">{t.proposalWizard.step3.colDescription}</th>
                      <th className="px-3.5 py-2.5 w-24 text-center">
                        {t.proposalWizard.step3.colQty}
                      </th>
                      <th className="px-3.5 py-2.5 w-40 text-right">
                        {t.proposalWizard.step3.colUnitCost}
                      </th>
                      <th className="px-3.5 py-2.5 w-44 text-right">
                        {t.proposalWizard.step3.colLineTotal}
                      </th>
                      <th className="px-3.5 py-2.5 w-16 text-center">
                        {t.proposalWizard.step3.colAction}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {rabItems.map((item, index) => {
                      const lineTotal = (item.volume || 0) * (item.biaya_satuan || 0);
                      const descError = stepErrors[`rab_${index}_desc`];
                      const costError = stepErrors[`rab_${index}_cost`];

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          {/* Kategori */}
                          <td className="px-3.5 py-2.5 align-top">
                            <Select
                              value={item.kategori}
                              onValueChange={(val) => handleUpdateRabItem(index, 'kategori', val)}
                            >
                              <SelectTrigger className="h-8 text-xs border-slate-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bahan Habis Pakai">
                                  {t.proposalWizard.step3.categories.consumables}
                                </SelectItem>
                                <SelectItem value="Pengumpulan Data">
                                  {t.proposalWizard.step3.categories.dataCollection}
                                </SelectItem>
                                <SelectItem value="Analisis Laboratorium">
                                  {t.proposalWizard.step3.categories.labAnalysis}
                                </SelectItem>
                                <SelectItem value="Pelaporan & Luaran">
                                  {t.proposalWizard.step3.categories.reporting}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Deskripsi */}
                          <td className="px-3.5 py-2.5 align-top">
                            <Input
                              placeholder={t.proposalWizard.step3.descPlaceholder}
                              value={item.deskripsi}
                              onChange={(e) =>
                                handleUpdateRabItem(index, 'deskripsi', e.target.value)
                              }
                              className={`h-8 text-xs ${
                                descError ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                              }`}
                            />
                            {descError && (
                              <p className="mt-1 text-[11px] font-medium text-rose-600">
                                {descError}
                              </p>
                            )}
                          </td>

                          {/* Volume */}
                          <td className="px-3.5 py-2.5 align-top text-center">
                            <Input
                              type="number"
                              min={1}
                              value={item.volume}
                              onChange={(e) =>
                                handleUpdateRabItem(index, 'volume', e.target.value)
                              }
                              className="h-8 w-20 mx-auto text-center font-mono text-xs border-slate-300"
                            />
                          </td>

                          {/* Biaya Satuan */}
                          <td className="px-3.5 py-2.5 align-top text-right">
                            <Input
                              type="number"
                              min={0}
                              step={1000}
                              value={item.biaya_satuan}
                              onChange={(e) =>
                                handleUpdateRabItem(index, 'biaya_satuan', e.target.value)
                              }
                              className={`h-8 w-36 ml-auto text-right font-mono text-xs ${
                                costError ? 'border-rose-500' : 'border-slate-300'
                              }`}
                            />
                            {costError && (
                              <p className="mt-1 text-[11px] font-medium text-rose-600">
                                {costError}
                              </p>
                            )}
                          </td>

                          {/* Line Total */}
                          <td className="px-3.5 py-2.5 align-middle text-right">
                            <TabularFigure value={lineTotal} type="currency" weight="semibold" />
                          </td>

                          {/* Action */}
                          <td className="px-3.5 py-2.5 align-middle text-center">
                            <button
                              type="button"
                              disabled={rabItems.length <= 1}
                              onClick={() => handleRemoveRabItem(index)}
                              className="text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:hover:text-slate-400"
                              title={t.proposalWizard.step3.removeItem}
                            >
                              <Trash2 className="h-4 w-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Grand Total Footer */}
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-sans">
                    <tr>
                      <td colSpan={4} className="px-3.5 py-3 text-right font-bold text-slate-800">
                        {t.proposalWizard.step3.grandTotalLabel}
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <TabularFigure
                          value={grandTotal}
                          type="currency"
                          size="lg"
                          weight="bold"
                          className={isPaguExceeded ? 'text-rose-700' : 'text-blue-950'}
                        />
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Berkas Proposal & Final Submission */}
        {currentStep === 4 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="font-serif text-xl font-semibold text-slate-900">
                {t.proposalWizard.step4.title}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t.proposalWizard.step4.subtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Proposal Summary Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t.proposalWizard.step4.summaryTitle}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">
                      {t.proposalWizard.step4.summaryScheme}
                    </span>
                    <p className="font-semibold text-slate-900">
                      {selectedSchema ? (selectedSchema.nama_skema || selectedSchema.name) : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">
                      {t.proposalWizard.step4.summaryTotalBudget}
                    </span>
                    <div>
                      <TabularFigure value={grandTotal} type="currency" weight="bold" size="base" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-500 font-medium">
                      {t.proposalWizard.step4.summaryTitleLabel}
                    </span>
                    <p className="font-serif font-semibold text-slate-900 text-sm">
                      {data.judul_penelitian || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">
                      {t.proposalWizard.step4.summaryTeamCount}
                    </span>
                    <p className="font-mono font-semibold text-slate-900">
                      {data.members.length + 1} {locale === 'en' ? 'Researchers' : 'Peneliti'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Uploader Guard */}
              <div className="space-y-2">
                <PDFUploader
                  value={data.file_dokumen_proposal}
                  onChange={(file) => {
                    setData('file_dokumen_proposal', file);
                    if (stepErrors.file_dokumen_proposal) {
                      setStepErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.file_dokumen_proposal;
                        return copy;
                      });
                    }
                  }}
                  maxSizeMB={10}
                  label={t.proposalWizard.step4.uploadLabel}
                  helperText={t.proposalWizard.step4.uploadHelper}
                  required={true}
                />
                {stepErrors.file_dokumen_proposal && (
                  <p className="text-xs font-medium text-rose-600">
                    {stepErrors.file_dokumen_proposal}
                  </p>
                )}
              </div>

              {/* Declaration of Integrity */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="integrity"
                    checked={integrityAgreed}
                    onCheckedChange={(checked) => {
                      setIntegrityAgreed(Boolean(checked));
                      if (stepErrors.integrity) {
                        setStepErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.integrity;
                          return copy;
                        });
                      }
                    }}
                    className="mt-0.5 border-slate-400 data-[state=checked]:bg-blue-900 data-[state=checked]:border-blue-900"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="integrity"
                      className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 cursor-pointer"
                    >
                      {t.proposalWizard.step4.integrityTitle}
                    </Label>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t.proposalWizard.step4.integrityStatement}
                    </p>
                  </div>
                </div>
                {stepErrors.integrity && (
                  <p className="text-xs font-medium text-rose-600 ml-7">
                    {stepErrors.integrity}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Global form errors */}
        {Object.keys(errors).length > 0 && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 space-y-1">
            <p className="font-bold">{t.proposalWizard.nav.validationErrorTitle}</p>
            <ul className="list-disc list-inside space-y-0.5 text-rose-700">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-lg sm:px-8">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Draft Saved Indicator */}
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-600">
            {lastSavedTime ? (
              <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-semibold">
                <Check className="h-3.5 w-3.5" />
                <span>
                  {t.proposalWizard.nav.draftSavedIndicator} (
                  {format(t.proposalWizard.nav.autoSavedAt, { time: lastSavedTime })})
                </span>
              </span>
            ) : isDirty ? (
              <span className="text-amber-700 font-medium font-mono">
                [PERUBAHAN BELUM DISIMPAN]
              </span>
            ) : (
              <span className="text-slate-400 font-mono">
                {t.proposalWizard.nav.draftSavedIndicator}
              </span>
            )}
          </div>

          {/* Right: Step navigation buttons */}
          <div className="flex items-center space-x-2.5">
            {/* Save Draft Button */}
            <Button
              type="button"
              variant="outline"
              disabled={processing}
              onClick={() => handleSubmit('draft')}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-sans text-xs"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {processing ? t.proposalWizard.nav.savingDraft : t.proposalWizard.nav.saveDraft}
            </Button>

            {/* Back Button */}
            <Button
              type="button"
              variant="secondary"
              disabled={currentStep === 1 || processing}
              onClick={handlePrevStep}
              className="font-sans text-xs text-slate-700"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              {t.proposalWizard.nav.prevStep}
            </Button>

            {/* Next or Submit Button */}
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={processing}
                className="bg-blue-900 text-white hover:bg-blue-800 font-sans text-xs"
              >
                {t.proposalWizard.nav.nextStep}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={processing || !integrityAgreed || !data.file_dokumen_proposal}
                onClick={() => handleSubmit('submit')}
                className="bg-emerald-700 text-white hover:bg-emerald-800 font-sans text-xs font-semibold"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {processing
                  ? t.proposalWizard.nav.submitting
                  : t.proposalWizard.nav.submitProposal}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
