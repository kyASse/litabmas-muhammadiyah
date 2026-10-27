/**
 * @file Logs.tsx
 * @description Halaman Log Perubahan Termin Pendanaan.
 * Bertugas menampilkan riwayat perubahan termin beserta fitur cetak PDF kwitansi.
 *
 * @author MUHAMAD BURHANUDIN AL BACHTIAR
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Settings } from 'lucide-react';
import { useState } from 'react';

interface FundingLog {
    id: number;
    termin_number: string;
    amount: number;
    status: string;
    updated_at: string;
    contract?: {
        title: string;
    };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    logs: {
        data: FundingLog[];
        links: PaginationLink[];
    };
}

export default function Logs({ logs }: Props) {
    // State untuk menyimpan pengaturan cetak PDF
    const [paperSize, setPaperSize] = useState('A4');
    const [orientation, setOrientation] = useState('landscape');
    const [customWidth, setCustomWidth] = useState(600);
    const [customHeight, setCustomHeight] = useState(300);

    // Fungsi untuk merakit URL cetak secara dinamis
    const getPrintUrl = (id: number) => {
        let url = `/finance/funding/${id}/print?size=${paperSize}&orientation=${orientation}`;
        if (paperSize === 'custom') {
            url += `&width=${customWidth}&height=${customHeight}`;
        }
        return url;
    };

    return (
        <AppLayout>
            <Head title="Log Perubahan Termin" />

            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                {/* --- Breadcrumbs Manual --- */}
                <div className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Link href="/finance" className="transition-colors hover:text-slate-900 dark:hover:text-slate-100">
                        Finance
                    </Link>
                    <span className="mx-2 text-slate-400 dark:text-slate-600">/</span>
                    <span className="text-slate-900 dark:text-slate-100">Funding Logs</span>
                </div>
                {/* -------------------------- */}

                <Card className="shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Riwayat Termin</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">Log perubahan dan cetak kwitansi pendanaan.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* Panel Pengaturan Cetak (Control Bar) */}
                        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <Settings className="h-4 w-4" /> Pengaturan Kertas:
                            </span>

                            <Select value={paperSize} onValueChange={setPaperSize}>
                                <SelectTrigger className="w-[140px] bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                                    <SelectValue placeholder="Pilih Kertas" />
                                </SelectTrigger>
                                <SelectContent className="dark:border-slate-800 dark:bg-slate-900">
                                    <SelectItem value="A4">A4</SelectItem>
                                    <SelectItem value="legal">Legal</SelectItem>
                                    <SelectItem value="letter">Letter</SelectItem>
                                    <SelectItem value="custom">Custom (PT)</SelectItem>
                                </SelectContent>
                            </Select>

                            {paperSize !== 'custom' && (
                                <Select value={orientation} onValueChange={setOrientation}>
                                    <SelectTrigger className="w-[140px] bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                                        <SelectValue placeholder="Orientasi" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:border-slate-800 dark:bg-slate-900">
                                        <SelectItem value="landscape">Landscape</SelectItem>
                                        <SelectItem value="portrait">Portrait</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            {paperSize === 'custom' && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">W:</span>
                                        <Input
                                            type="number"
                                            value={customWidth}
                                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                                            className="w-24 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            placeholder="Width"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">H:</span>
                                        <Input
                                            type="number"
                                            value={customHeight}
                                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                                            className="w-24 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            placeholder="Height"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tabel Data */}
                        <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-700 uppercase dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Judul Kontrak</th>
                                        <th className="px-4 py-3 font-semibold">Termin</th>
                                        <th className="px-4 py-3 font-semibold">Nominal</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Updated At</th>
                                        <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {logs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="bg-white transition-colors hover:bg-slate-50/50 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                                        >
                                            <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{log.contract?.title ?? '-'}</td>
                                            <td className="px-4 py-4">{log.termin_number}</td>
                                            <td className="px-4 py-4 font-mono text-slate-900 dark:text-slate-100">
                                                Rp {Number(log.amount).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/40">
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                                                {new Date(log.updated_at).toLocaleString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                                >
                                                    <a href={getPrintUrl(log.id)} target="_blank" rel="noopener noreferrer">
                                                        Cetak PDF
                                                    </a>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}

                                    {logs.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                                                Tidak ada riwayat termin ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Navigasi Paginasi */}
                        {logs.links && logs.links.length > 3 && (
                            <div className="mt-6 flex flex-wrap items-center justify-end gap-1">
                                {logs.links.map((link, index) => {
                                    if (link.url === null) {
                                        return (
                                            <span
                                                key={index}
                                                className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-600"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                                                link.active
                                                    ? 'border-slate-900 bg-slate-900 font-medium text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
