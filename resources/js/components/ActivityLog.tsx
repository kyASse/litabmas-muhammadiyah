import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface User {
    id?: number;
    name: string;
    email?: string;
}

interface Loggable {
    id: number;
    // other properties depending on the polymorphic model
}

interface ActivityLogItem {
    id: number;
    user?: User | null;
    action: string;
    description: string;
    created_at: string;
    loggable?: Loggable;
}

interface ActivityLogProps {
    logs: ActivityLogItem[];
    title?: string;
}

export default function ActivityLog({ logs, title = 'Activity Stream' }: ActivityLogProps) {
    if (!logs || logs.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity found.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {logs.map((log, logIdx) => (
                        <li key={log.id}>
                            <div className="relative pb-8">
                                {logIdx !== logs.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white dark:bg-blue-950/60 dark:ring-slate-900">
                                            <svg
                                                className="h-4 w-4 text-blue-600 dark:text-blue-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {log.user ? (
                                                    <span className="font-medium text-slate-900 dark:text-slate-200">{log.user.name}</span>
                                                ) : (
                                                    <span className="font-medium text-slate-900 dark:text-slate-200">System</span>
                                                )}{' '}
                                                {log.action} <span className="text-slate-700 dark:text-slate-300">{log.description}</span>
                                            </p>
                                        </div>
                                        <div className="text-right text-xs whitespace-nowrap text-slate-400 dark:text-slate-500">
                                            <time dateTime={log.created_at}>
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
