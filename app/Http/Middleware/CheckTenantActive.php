<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantActive
{
    /**
     * Handle an incoming request.
     *
     * Invarian Kasus Batas 3 (Tenant Suspension):
     * Jika universitas dinonaktifkan (is_active = false), seluruh civitas kampus
     * (non-Super Admin) dicegat seketika, sesi dihanguskan, dan diarahkan ke login / 403.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isSuperAdmin()) {
            $university = $user->university;

            if ($university && ! $university->is_active) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->wantsJson()) {
                    return response()->json([
                        'message' => '[BLOKIR] Akses institusi Anda saat ini dinonaktifkan. Silakan hubungi Administrator.',
                    ], 403);
                }

                return redirect()->route('login')->withErrors([
                    'email' => '[BLOKIR] Akses institusi universitas Anda saat ini sedang disuspensi oleh Administrator Sistem.',
                ]);
            }
        }

        return $next($request);
    }
}
