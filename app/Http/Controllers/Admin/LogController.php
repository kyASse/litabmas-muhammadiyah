<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    /**
     * Display a listing of the system logs.
     *
     * @return Response
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('activity', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $logs = $query->paginate(15)->withQueryString();

        $stats = [
            'total_logs' => ActivityLog::count(),
            'today_logs' => ActivityLog::whereDate('created_at', today())->count(),
            'unique_users' => ActivityLog::whereNotNull('user_id')->distinct('user_id')->count('user_id'),
            'unique_ips' => ActivityLog::whereNotNull('ip_address')->distinct('ip_address')->count('ip_address'),
        ];

        return Inertia::render('Admin/Logs/Index', [
            'logs' => $logs,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }
}
