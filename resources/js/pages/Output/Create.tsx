/**
 * Output/Create.tsx — Fallback redirect to Output/Index with create modal active.
 */

import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { route } from 'ziggy-js';

export default function OutputCreate() {
    useEffect(() => {
        router.visit(route('outputs.index', { create: '1' }));
    }, []);

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <span className="font-mono text-xs">Memuat formulir pelaporan luaran riset...</span>
        </div>
    );
}
