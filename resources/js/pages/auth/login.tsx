import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/hooks/use-translation';
import { Head, Link, useForm } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { FormEventHandler } from 'react';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

export default function Login() {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title={`${t.common.appName} - ${t.auth.loginTitle}`} />

            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <Link href="/" className="inline-flex flex-col items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-md">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t.common.appName}</h1>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t.auth.portalSubtitle}</p>
                        </Link>
                    </div>

                    {/* Login Card */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.auth.loginTitle}</h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.auth.loginSubtitle}</p>
                            </div>
                            <LanguageSwitcher variant="segmented" />
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <Label htmlFor="email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {t.auth.emailLabel}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t.auth.emailPlaceholder}
                                    required
                                    autoFocus
                                    className="mt-1.5 h-10 rounded-lg border-slate-200 text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900 dark:border-slate-800 dark:bg-slate-950"
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {t.auth.passwordLabel}
                                    </Label>
                                    <Link
                                        href={route('password.request')}
                                        className="text-[11px] font-medium text-blue-900 hover:underline dark:text-blue-400"
                                    >
                                        {t.auth.forgotPassword}
                                    </Link>
                                </div>
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

                            {/* Remember Me */}
                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked as boolean)}
                                />
                                <Label htmlFor="remember" className="cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                                    {t.auth.rememberMe}
                                </Label>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="mt-2 h-10 w-full rounded-lg bg-blue-900 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
                            >
                                {processing ? t.auth.processingSignIn : t.auth.signInButton}
                            </Button>
                        </form>

                        {/* Register Link */}
                        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            {t.auth.registerPrompt}{' '}
                            <Link href={route('register')} className="font-semibold text-blue-900 hover:underline dark:text-blue-400">
                                {t.auth.registerNow}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
