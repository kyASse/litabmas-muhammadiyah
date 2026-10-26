import logoUrl from '@/assets/logo_dark.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { UniversityCombobox } from '@/components/ui/university-combobox';
import { useTranslation } from '@/hooks/use-translation';
import { Head, Link, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { FormEventHandler } from 'react';

type University = {
    id: number;
    name: string;
    code: string;
    short_name?: string;
};

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    university_id: string;
    nidn: string;
    faculty: string;
    study_program: string;
    phone: string;
};

interface Props {
    universities: University[];
}

export default function Register({ universities }: Props) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        university_id: '',
        nidn: '',
        faculty: '',
        study_program: '',
        phone: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <>
            <Head title={`${t.common.appName} - ${t.auth.registerTitle}`} />

            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
                <div className="w-full max-w-xl">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <Link href="/" className="inline-flex flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800">
                                <img src={logoUrl} alt={t.common.appName} className="h-10 w-10 object-contain" />
                            </div>
                            <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t.common.appName}</h1>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t.auth.portalSubtitle}</p>
                        </Link>
                    </div>

                    {/* Register Card */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.auth.registerTitle}</h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.auth.registerSubtitle}</p>
                            </div>
                            <LanguageSwitcher variant="segmented" />
                        </div>

                        {/* Approval Notice Banner */}
                        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-800 dark:text-blue-400" />
                            <p className="leading-relaxed">{t.auth.approvalNotice}</p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <Label htmlFor="name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.auth.fullNameLabel} *
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t.auth.fullNamePlaceholder}
                                    required
                                    autoFocus
                                    className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.auth.emailLabel} *
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t.auth.emailPlaceholder}
                                    required
                                    className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                            </div>

                            {/* University Selection */}
                            <div>
                                <Label htmlFor="university" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.auth.universityLabel} *
                                </Label>
                                <div className="mt-1.5">
                                    <UniversityCombobox
                                        universities={universities}
                                        value={data.university_id}
                                        onValueChange={(value) => setData('university_id', value)}
                                        placeholder={t.auth.universityPlaceholder}
                                        error={errors.university_id}
                                    />
                                </div>
                            </div>

                            {/* Academic Profile (NIDN & Phone) */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="nidn" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.auth.nidnLabel}
                                    </Label>
                                    <Input
                                        id="nidn"
                                        value={data.nidn}
                                        onChange={(e) => setData('nidn', e.target.value)}
                                        placeholder={t.auth.nidnPlaceholder}
                                        className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                    />
                                    {errors.nidn && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nidn}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="phone" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.auth.phoneLabel}
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder={t.auth.phonePlaceholder}
                                        className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                    />
                                    {errors.phone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
                                </div>
                            </div>

                            {/* Faculty & Study Program */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="faculty" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.auth.facultyLabel}
                                    </Label>
                                    <Input
                                        id="faculty"
                                        value={data.faculty}
                                        onChange={(e) => setData('faculty', e.target.value)}
                                        placeholder={t.auth.facultyPlaceholder}
                                        className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                    />
                                    {errors.faculty && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.faculty}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="study_program" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.auth.studyProgramLabel}
                                    </Label>
                                    <Input
                                        id="study_program"
                                        value={data.study_program}
                                        onChange={(e) => setData('study_program', e.target.value)}
                                        placeholder={t.auth.studyProgramPlaceholder}
                                        className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                    />
                                    {errors.study_program && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.study_program}</p>}
                                </div>
                            </div>

                            {/* Password & Confirmation */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.auth.passwordLabel} *
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder={t.auth.passwordPlaceholder}
                                        required
                                        className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                    />
                                    {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="password_confirmation" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.auth.passwordConfirmLabel} *
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder={t.auth.passwordConfirmPlaceholder}
                                        required
                                        className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.auth.passwordHint}</p>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="mt-4 h-10 w-full rounded-lg bg-blue-900 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
                            >
                                {processing ? t.auth.registeringButton : t.auth.registerButton}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            {t.auth.alreadyHaveAccount}{' '}
                            <Link href={route('login')} className="font-semibold text-blue-900 hover:underline dark:text-blue-400">
                                {t.auth.loginHere}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
