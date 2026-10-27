/**
 * BarChart Component
 *
 * @description
 * Grafik batang interaktif untuk visualisasi serapan dana tahunan.
 *
 * @author JurnalMU Team
 * @filepath /resources/js/components/Charts/BarChart.tsx
 */

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';

interface BarChartProps {
    data: { year: number; amount: number }[];
}

export default function BarChart({ data }: BarChartProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkMode = mounted && resolvedTheme === 'dark';

    const options = {
        chart: {
            id: 'funding-bar-chart',
            toolbar: {
                show: false,
            },
            fontFamily: 'inherit',
            background: 'transparent',
        },
        theme: {
            mode: (isDarkMode ? 'dark' : 'light') as 'dark' | 'light',
        },
        xaxis: {
            categories: data.map((item) => item.year.toString()),
            title: {
                text: 'Tahun',
                style: {
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                },
            },
            labels: {
                style: {
                    colors: isDarkMode ? '#94a3b8' : '#64748b',
                },
            },
            axisBorder: {
                color: isDarkMode ? '#334155' : '#cbd5e1',
            },
            axisTicks: {
                color: isDarkMode ? '#334155' : '#cbd5e1',
            },
        },
        yaxis: {
            title: {
                text: 'Total Pendanaan (Rp)',
                style: {
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                },
            },
            labels: {
                style: {
                    colors: isDarkMode ? '#94a3b8' : '#64748b',
                },
                formatter: (value: number) => {
                    return new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                    }).format(value);
                },
            },
        },
        colors: [isDarkMode ? '#60a5fa' : '#3b82f6'],
        grid: {
            borderColor: isDarkMode ? '#1e293b' : '#f1f5f9',
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '55%',
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
        },
        fill: {
            opacity: 1,
        },
        tooltip: {
            theme: (isDarkMode ? 'dark' : 'light') as 'dark' | 'light',
            y: {
                formatter: function (val: number) {
                    return new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                    }).format(val);
                },
            },
        },
    };

    const series = [
        {
            name: 'Total Pendanaan',
            data: data.map((item) => item.amount),
        },
    ];

    return (
        <div className="w-full">
            <Chart options={options} series={series} type="bar" height={350} />
        </div>
    );
}
