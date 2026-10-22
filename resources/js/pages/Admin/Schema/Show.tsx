/**
 * SchemaShow Component
 *
 * @description
 * Detail view for research schemes, displaying configuration,
 * linked research proposals, and investigator details.
 *
 * @filepath resources/js/pages/Admin/Schema/Show.tsx
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { MetricCard } from '@/components/ui/MetricCard';
import PageHeader from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building, Calendar, ClipboardList, Edit, FileText, Layers, Mail, User } from 'lucide-react';
import { route } from 'ziggy-js';

interface University {
    id: number;
    name: string;
    short_name: string | null;
}

interface ProposingUser {
    id: number;
    name: string;
    email: string;
    position: string | null;
    university: University | null;
}

interface Proposal {
    id: number;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    user: ProposingUser;
}

interface Schema {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    proposals: Proposal[];
}

interface Props {
    schema: Schema | { data: Schema };
}

export default function SchemaShow({ schema }: Props) {
    const { t } = useTranslation();
    const schemaData = (schema && 'data' in schema ? schema.data : schema) as Schema;
    const schemaId = schemaData?.id;
    const schemaName = schemaData?.name || '';

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation.dashboard,
            href: '/dashboard',
        },
        {
            title: t.adminSchema.pageTitle,
            href: route('admin.schema.index'),
        },
        {
            title: schemaName,
            href: schemaId ? route('admin.schema.show', schemaId) : '#',
        },
    ];

    const proposalsCount = schemaData?.proposals ? schemaData.proposals.length : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t.adminSchema.detailTitle}: ${schemaName}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <PageHeader
                    title={schemaName}
                    subtitle={t.adminSchema.detailSubtitle}
                    isEditorialSerif={false}
                    breadcrumbs={breadcrumbs}
                    actions={
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher variant="compact" />
                            <Button variant="outline" size="sm" asChild className="gap-1.5 border-slate-300">
                                <Link href={schemaId ? route('admin.schema.edit', schemaId) : '#'}>
                                    <Edit className="h-3.5 w-3.5" />
                                    {t.common.edit}
                                </Link>
                            </Button>
                        </div>
                    }
                />

                <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900" asChild>
                        <Link href={route('admin.schema.index')}>
                            <ArrowLeft className="h-4 w-4" />
                            {t.common.back}
                        </Link>
                    </Button>
                </div>

                {/* Main Schema Information Section */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-slate-200 bg-white shadow-xs md:col-span-2">
                        <CardHeader className="border-b border-slate-100 pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                                <ClipboardList className="h-4 w-4 text-blue-900" />
                                {t.adminSchema.schemeInfo}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">{t.adminSchema.detailSubtitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div className="space-y-1">
                                <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{t.adminSchema.tableColName}</h3>
                                <p className="text-base font-bold text-slate-900">{schemaName}</p>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{t.adminSchema.tableColDesc}</h3>
                                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-800">
                                    {schemaData?.description || <em className="text-xs text-slate-400">{t.adminSchema.noDescription}</em>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <MetricCard
                            title={t.adminSchema.totalProposalsLinked}
                            value={proposalsCount}
                            type="integer"
                            icon={Layers}
                            iconBgClass="bg-blue-50"
                            iconColorClass="text-blue-900"
                            caption={t.adminSchema.proposalsLinkedSubtitle}
                        />

                        <Card className="border-slate-200 bg-white shadow-xs">
                            <CardHeader className="border-b border-slate-100 pb-3">
                                <CardTitle className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                                    {t.adminSchema.schemeStats}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-4 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        {t.adminSchema.tableColCreated}:
                                    </span>
                                    <span className="font-medium text-slate-900">
                                        {schemaData?.created_at ? new Date(schemaData.created_at).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Proposals List Section */}
                <Card className="border-slate-200 bg-white shadow-xs">
                    <CardHeader className="border-b border-slate-100 pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <FileText className="h-4 w-4 text-blue-900" />
                            {t.adminSchema.linkedProposalsTitle}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">{t.adminSchema.proposalsLinkedSubtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
                                    <TableHead className="w-[60px] text-center text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminSchema.tableColNo}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColTitle}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColAuthor}
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.navigation.universities}
                                    </TableHead>
                                    <TableHead className="w-[180px] text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.adminProposals.tableColDate}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proposalsCount === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                                            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                            <p className="text-sm font-medium">{t.adminSchema.noLinkedProposals}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (schemaData?.proposals || []).map((proposal, index) => (
                                        <TableRow key={proposal.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                                            <TableCell className="text-center text-xs font-medium text-slate-500">{index + 1}</TableCell>
                                            <TableCell className="max-w-sm">
                                                <div className="space-y-0.5">
                                                    <p className="line-clamp-2 text-sm font-semibold text-slate-900" title={proposal.title}>
                                                        {proposal.title}
                                                    </p>
                                                    <p className="line-clamp-1 text-xs text-slate-500" title={proposal.description}>
                                                        {proposal.description}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                        {proposal.user?.name}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        {proposal.user?.email}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="space-y-0.5 text-slate-600">
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <Building className="h-3.5 w-3.5 text-slate-400" />
                                                        {proposal.user?.university?.name || '-'}
                                                    </div>
                                                    {proposal.user?.position && (
                                                        <Badge variant="secondary" className="text-[10px] font-normal">
                                                            {proposal.user.position}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {new Date(proposal.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
