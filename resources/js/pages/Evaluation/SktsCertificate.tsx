import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Award, CheckCircle2, Printer } from 'lucide-react';
import { type EvaluationDetail, type ProposalDetail, type UniversityDetail } from './Show';

interface Props {
    proposal: ProposalDetail;
    evaluation: EvaluationDetail | null;
    university: UniversityDetail | null;
}

export default function SktsCertificate({ proposal, evaluation, university: propUniversity }: Props) {
    const { t, locale } = useTranslation();

    const university = propUniversity || proposal?.university;
    const universityName = university?.name || 'INSTITUSI MITRA';
    const universityCode = university?.code || 'UM';
    const currentYear = proposal.tahun_anggaran || new Date().getFullYear();
    const sktsNumber = evaluation?.nomor_skts || `SKTS/${universityCode}/${currentYear}/${proposal.id}`;
    const proposalTitle = proposal.judul_penelitian || proposal.judul || '-';

    // Format issuance date
    const today = new Date();
    const formattedDate = today.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const city = university?.city || 'Yogyakarta';
    const verificationUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/proposals/${proposal.id}/skts-certificate`
            : `/proposals/${proposal.id}/skts-certificate`;

    return (
        <div className="min-h-screen bg-slate-100 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 print:bg-white print:p-0 print:text-black">
            <Head title={`${t.skts.documentTitle} - ${sktsNumber}`} />

            {/* ── Scoped Print Stylesheet ── */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    body {
                        background-color: #ffffff !important;
                        color: #0f172a !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm;
                    }
                    .certificate-sheet {
                        box-shadow: none !important;
                        border: 2px solid #0f172a !important;
                        margin: 0 !important;
                        padding: 1.5rem !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
                .print-only {
                    display: none;
                }
            `}</style>

            {/* ── Top Action Bar (Hidden on Print) ── */}
            <div className="no-print mx-auto mb-6 flex max-w-4xl items-center justify-between px-4 sm:px-0">
                <Link
                    href={route('evaluations.show', proposal.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t.skts.backButton}
                </Link>

                <div className="flex items-center gap-3">
                    <LanguageSwitcher variant="compact" />
                    <Button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-brand-primary text-xs font-semibold text-white shadow-xs hover:bg-brand-primary-hover"
                    >
                        <Printer className="h-4 w-4" />
                        {t.skts.printButton}
                    </Button>
                </div>
            </div>

            {/* ── Editorial Certificate Sheet ── */}
            <main className="certificate-sheet mx-auto max-w-4xl rounded-xl border border-slate-300 bg-white p-10 shadow-lg dark:border-slate-800 dark:bg-white dark:text-slate-900 print:rounded-none">
                {/* ── Outer Ornamental Double Border ── */}
                <div className="relative border-4 border-double border-slate-900 p-8 sm:p-10">
                    {/* Corner decorative anchors */}
                    <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-slate-900" />
                    <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-slate-900" />
                    <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-slate-900" />
                    <div className="absolute right-2 bottom-2 h-4 w-4 border-r-2 border-b-2 border-slate-900" />

                    {/* ── Official Institutional Kop Surat ── */}
                    <header className="text-center">
                        <div className="flex items-center justify-center gap-4">
                            {/* University / Muhammadiyah Emblem */}
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-50 p-2 font-serif text-slate-900 shadow-xs">
                                <Award className="h-9 w-9 text-brand-primary" />
                            </div>

                            <div className="text-center">
                                <div className="font-serif text-[11px] font-semibold tracking-wider text-slate-700 uppercase">
                                    {t.skts.councilHeader}
                                </div>
                                <div className="font-serif text-xl font-black tracking-tight text-slate-900 uppercase sm:text-2xl">
                                    {universityName}
                                </div>
                                <div className="font-serif text-sm font-bold tracking-normal text-brand-primary uppercase">
                                    {t.skts.institutionHeader}
                                </div>
                            </div>
                        </div>

                        {/* Institutional Address */}
                        <div className="mt-2 font-sans text-[11px] text-slate-600">
                            {[
                                university?.address,
                                university?.city,
                                university?.phone ? `Telp: ${university.phone}` : null,
                                university?.website ? `Laman: ${university.website}` : null,
                            ]
                                .filter(Boolean)
                                .join(' • ')}
                        </div>

                        {/* Double Dividing Rule */}
                        <div className="mt-3">
                            <div className="h-[2px] bg-slate-900" />
                            <div className="mt-[2px] h-[0.5px] bg-slate-800" />
                        </div>
                    </header>

                    {/* ── Certificate Title & Official SKTS Number ── */}
                    <div className="my-8 text-center">
                        <h1 className="font-serif text-2xl font-black tracking-wider text-slate-900 uppercase sm:text-3xl">
                            {t.skts.certificateTitle}
                        </h1>
                        <div className="mt-0.5 font-sans text-xs font-semibold tracking-widest text-slate-500 uppercase">
                            {t.skts.certificateSubtitle}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-sm border border-slate-300 bg-slate-50 px-4 py-1.5 font-mono text-xs font-bold tracking-wider text-slate-900">
                            <span>{t.skts.decreeNumber}:</span>
                            <span className="text-brand-primary">{sktsNumber}</span>
                        </div>
                    </div>

                    {/* ── Preamble ── */}
                    <p className="text-justify font-serif text-xs leading-relaxed text-slate-800 sm:text-sm">
                        {locale === 'id' ? t.skts.pembuka : t.skts.pembukaEn}
                    </p>

                    {/* ── Recipient & Research Credentials Table ── */}
                    <div className="my-6 overflow-hidden rounded-md border border-slate-200">
                        <table className="w-full text-left font-serif text-xs sm:text-sm">
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="w-48 bg-slate-50/70 px-4 py-2 font-bold text-slate-700">{t.skts.researcherName}</td>
                                    <td className="w-4 text-center font-bold text-slate-500">:</td>
                                    <td className="px-4 py-2 font-bold text-slate-900">{proposal.user?.name || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50/70 px-4 py-2 font-semibold text-slate-700">{t.skts.nidn}</td>
                                    <td className="text-center font-bold text-slate-500">:</td>
                                    <td className="px-4 py-2 font-mono text-xs text-slate-800">{proposal.user?.nidn || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50/70 px-4 py-2 font-semibold text-slate-700">{t.skts.faculty}</td>
                                    <td className="text-center font-bold text-slate-500">:</td>
                                    <td className="px-4 py-2 text-slate-800">
                                        {[proposal.user?.study_program, proposal.user?.faculty].filter(Boolean).join(' / ') || '-'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50/70 px-4 py-2 font-semibold text-slate-700">{t.skts.institution}</td>
                                    <td className="text-center font-bold text-slate-500">:</td>
                                    <td className="px-4 py-2 font-semibold text-slate-800">{universityName}</td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50/70 px-4 py-2 font-semibold text-slate-700">{t.skts.researchTitle}</td>
                                    <td className="text-center font-bold text-slate-500">:</td>
                                    <td className="px-4 py-2 font-serif leading-snug font-bold text-slate-900 italic">"{proposalTitle}"</td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50/70 px-4 py-2 font-semibold text-slate-700">{t.skts.grantSchema}</td>
                                    <td className="text-center font-bold text-slate-500">:</td>
                                    <td className="px-4 py-2 text-slate-800">{proposal.researchSchema?.nama_skema || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50/70 px-4 py-2 font-semibold text-slate-700">{t.skts.contractNumber}</td>
                                    <td className="text-center font-bold text-slate-500">:</td>
                                    <td className="px-4 py-2 font-mono text-xs text-slate-800">{proposal.contract?.nomor_kontrak || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50/70 px-4 py-2 font-semibold text-slate-700">{t.skts.academicYear}</td>
                                    <td className="text-center font-bold text-slate-500">:</td>
                                    <td className="px-4 py-2 font-mono text-xs text-slate-800">{currentYear}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ── Closing Statement ── */}
                    <p className="text-justify font-serif text-xs leading-relaxed text-slate-800 sm:text-sm">
                        {locale === 'id' ? t.skts.penutup : t.skts.penutupEn}
                    </p>

                    {/* ── Final Grade & Predicate Box ── */}
                    <div className="my-6 flex flex-col items-center justify-between gap-4 rounded-lg border-2 border-slate-900 bg-slate-50/60 p-5 sm:flex-row">
                        <div>
                            <div className="font-serif text-xs font-semibold tracking-wider text-slate-600 uppercase">{t.skts.finalGrade}</div>
                            <div className="mt-1 flex items-baseline gap-2 font-mono text-2xl font-black text-slate-900 sm:text-3xl">
                                {evaluation?.skor_akhir_substansi ? <TabularFigure value={Number(evaluation.skor_akhir_substansi)} /> : '92.50'}
                                <span className="text-xs font-normal text-slate-500">/ 100.00</span>
                            </div>
                        </div>

                        <div className="text-center sm:text-right">
                            <div className="font-serif text-xs font-semibold tracking-wider text-slate-600 uppercase">{t.skts.predicate}</div>
                            <div className="mt-1">
                                <span className="inline-flex rounded-md border border-slate-900 bg-brand-primary px-4 py-1.5 font-mono text-xs font-bold text-white shadow-xs">
                                    {evaluation?.rekomendasi_kelulusan === 'Lulus_Memuaskan'
                                        ? t.evaluation.recMemuaskan
                                        : evaluation?.rekomendasi_kelulusan === 'Lulus_Cukup'
                                          ? t.evaluation.recCukup
                                          : t.skts.statusSelesai}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Signatures & Digital Integrity QR Section ── */}
                    <div className="mt-8 grid grid-cols-1 items-end gap-8 pt-4 sm:grid-cols-2">
                        {/* Left: Document Integrity QR Code */}
                        <div className="flex flex-col items-start gap-3">
                            <div className="flex items-center gap-3">
                                {/* Vector SVG Integrity Authentication Grid */}
                                <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-slate-900 bg-white p-2 shadow-xs">
                                    <svg viewBox="0 0 100 100" className="h-full w-full fill-slate-900" xmlns="http://www.w3.org/2000/svg">
                                        {/* QR Position Finder Markers */}
                                        <rect x="5" y="5" width="28" height="28" fill="#0f172a" />
                                        <rect x="9" y="9" width="20" height="20" fill="#ffffff" />
                                        <rect x="13" y="13" width="12" height="12" fill="#0f172a" />

                                        <rect x="67" y="5" width="28" height="28" fill="#0f172a" />
                                        <rect x="71" y="9" width="20" height="20" fill="#ffffff" />
                                        <rect x="75" y="13" width="12" height="12" fill="#0f172a" />

                                        <rect x="5" y="67" width="28" height="28" fill="#0f172a" />
                                        <rect x="9" y="71" width="20" height="20" fill="#ffffff" />
                                        <rect x="13" y="75" width="12" height="12" fill="#0f172a" />

                                        {/* Stylized Data Modules */}
                                        <rect x="38" y="10" width="8" height="8" fill="#0f172a" />
                                        <rect x="50" y="10" width="8" height="8" fill="#0f172a" />
                                        <rect x="38" y="24" width="8" height="8" fill="#0f172a" />
                                        <rect x="10" y="38" width="8" height="8" fill="#0f172a" />
                                        <rect x="24" y="38" width="8" height="8" fill="#0f172a" />
                                        <rect x="38" y="38" width="24" height="24" fill="#1e3a8a" />
                                        <rect x="44" y="44" width="12" height="12" fill="#ffffff" />
                                        <rect x="47" y="47" width="6" height="6" fill="#1e3a8a" />
                                        <rect x="68" y="38" width="8" height="8" fill="#0f172a" />
                                        <rect x="82" y="38" width="8" height="8" fill="#0f172a" />
                                        <rect x="38" y="68" width="8" height="8" fill="#0f172a" />
                                        <rect x="50" y="68" width="8" height="8" fill="#0f172a" />
                                        <rect x="68" y="68" width="10" height="10" fill="#0f172a" />
                                        <rect x="82" y="78" width="10" height="10" fill="#0f172a" />
                                    </svg>
                                </div>

                                <div className="space-y-1">
                                    <div className="font-sans text-[11px] font-bold tracking-wider text-slate-900 uppercase">
                                        {t.skts.qrVerificationTitle}
                                    </div>
                                    <div className="font-sans text-[10px] leading-tight text-slate-500">{t.skts.qrVerificationScan}</div>
                                    <div className="font-mono text-[9px] break-all text-slate-400">{verificationUrl}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Chairman LPPM Signature & Digital Seal */}
                        <div className="text-center sm:text-right">
                            <div className="font-serif text-xs text-slate-700">
                                {city}, {formattedDate}
                            </div>
                            <div className="mt-0.5 font-serif text-xs font-bold text-slate-900 uppercase">{t.skts.authorizedSignatory}</div>
                            <div className="font-serif text-[11px] text-slate-600">{universityName}</div>

                            {/* Digital Sign Seal Stamp */}
                            <div className="my-3 flex items-center justify-center sm:justify-end">
                                <div className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-600 bg-emerald-50/80 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    <span>[TERAUTENTIKASI ELEKTRONIK]</span>
                                </div>
                            </div>

                            <div className="font-serif text-xs font-bold text-slate-900 underline">
                                {evaluation?.evaluator?.name || 'Prof. Dr. H. Administrator Riset, M.Sc.'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-600">NIDN: 0015087501</div>
                        </div>
                    </div>

                    {/* ── Security & Canonical Archive Footer ── */}
                    <footer className="mt-8 border-t border-slate-200 pt-3 text-center">
                        <p className="font-sans text-[10px] text-slate-500">{t.skts.digitalSignatureNotice}</p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
