/**
 * Admin Dashboard Page Component
 *
 * @description
 * Institutional LPPM Research Dashboard providing helicopter-view analytics
 * for university proposals, funding absorption, faculty performance, and system activity logs.
 *
 * @filepath resources/js/pages/Dashboard/Admin.tsx
 */

import ActivityLog from '@/components/ActivityLog';
import BarChart from '@/components/Charts/BarChart';
import PieChart from '@/components/Charts/PieChart';
import FacultyTable from '@/components/FacultyTable';
import TopLecturerList from '@/components/TopLecturerList';
import TopResearchList from '@/components/TopResearchList';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { MetricCard } from '@/components/ui/MetricCard';
import PageHeader from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Coins, FileText, TrendingUp } from 'lucide-react';

interface DashboardStats {
    total_proposals: number;
    approved_proposals: number;
    rejected_proposals: number;
    success_rate: number;
    total_absorbed_funding: number;
}

interface FacultyPerformanceItem {
    faculty_name: string;
    submitted: number;
    accepted: number;
}

interface ResearchItem {
    id: number;
    title: string;
    citations: number;
}

interface LecturerItem {
    name: string;
    score: number;
}

interface ActivityLogItem {
    id: number;
    action: string;
    description: string;
    created_at: string;
    user: { name: string } | null;
}

interface Props {
    stats: DashboardStats;
    yearlyFundingData: { year: number; amount: number }[];
    facultyPerformance: FacultyPerformanceItem[];
    topResearch: ResearchItem[];
    topLecturers: LecturerItem[];
    systemLogs: ActivityLogItem[];
}

export default function AdminDashboard({ stats, yearlyFundingData, facultyPerformance, topResearch, topLecturers, systemLogs }: Props) {
    const { t, format } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.adminDashboard.pageTitle,
            href: '/admin/dashboard',
        },
    ];

    // Map faculty performance to category distribution for PieChart
    const pieChartData = facultyPerformance.map((item) => ({
        label: item.faculty_name,
        value: item.submitted,
        percentage: 0,
    }));

    const proposalsCaption = `${format(t.adminDashboard.approvedCount, { count: stats.approved_proposals })} • ${format(t.adminDashboard.rejectedCount, { count: stats.rejected_proposals })}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminDashboard.pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title={t.adminDashboard.pageTitle}
                    subtitle={t.adminDashboard.pageSubtitle}
                    isEditorialSerif={false}
                    breadcrumbs={breadcrumbs}
                    actions={<LanguageSwitcher variant="compact" />}
                />

                {/* ROW 1: Summary Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricCard
                        title={t.adminDashboard.totalAbsorbedFunding}
                        value={stats.total_absorbed_funding}
                        type="currency"
                        icon={Coins}
                        iconBgClass="bg-blue-50"
                        iconColorClass="text-blue-900"
                        caption={t.adminDashboard.absorbedFundingSubtitle}
                    />

                    <MetricCard
                        title={t.adminDashboard.totalProposals}
                        value={stats.total_proposals}
                        type="integer"
                        icon={FileText}
                        iconBgClass="bg-slate-100"
                        iconColorClass="text-slate-800"
                        caption={proposalsCaption}
                    />

                    <MetricCard
                        title={t.adminDashboard.successRate}
                        value={stats.success_rate}
                        type="percentage"
                        icon={TrendingUp}
                        iconBgClass="bg-emerald-50"
                        iconColorClass="text-emerald-700"
                        caption={t.adminDashboard.successRateSubtitle}
                    />
                </div>

                {/* ROW 2: Graphs Split Screen */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* Left: BarChart (60%) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-3">
                        <h2 className="mb-4 text-base font-bold text-slate-900">{t.adminDashboard.yearlyFundingTitle}</h2>
                        <BarChart data={yearlyFundingData} />
                    </div>

                    {/* Right: PieChart (40%) */}
                    <div className="lg:col-span-2">
                        <PieChart title={t.adminDashboard.facultyDistributionTitle} categories={pieChartData} />
                    </div>
                </div>

                {/* ROW 3: Leaderboard & Audit Logs */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <TopLecturerList data={topLecturers} />
                    <TopResearchList data={topResearch} />
                    <div className="h-full">
                        <ActivityLog logs={systemLogs} title={t.adminDashboard.systemLogsTitle} />
                    </div>
                </div>

                {/* ROW 4: Detailed Faculty Performance Table */}
                <div className="w-full">
                    <FacultyTable data={facultyPerformance} />
                </div>
            </div>
        </AppLayout>
    );
}
