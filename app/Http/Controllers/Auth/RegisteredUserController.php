<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\University;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        // Get active universities for dropdown (with 1-hour cache)
        $universities = Cache::remember('universities.active.registration', 3600, function () {
            return University::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']);
        });

        return Inertia::render('auth/register', [
            'universities' => $universities,
        ]);
    }

    /**
     * Handle an incoming registration request for Researcher (Peneliti).
     *
     * @throws ValidationException
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'university_id' => 'required|exists:universities,id',
            'nidn' => 'nullable|string|max:50',
            'faculty' => 'nullable|string|max:150',
            'study_program' => 'nullable|string|max:150',
            'phone' => 'nullable|string|max:50',
        ]);

        // Automatically assign Peneliti role for public researcher registration
        $roleId = DB::table('roles')->where('name', Role::PENELITI)->value('id');

        if (! $roleId) {
            return back()->withErrors([
                'email' => 'Role configuration error: Role Peneliti not found. Please contact administrator.',
            ]);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $roleId,
            'university_id' => $request->university_id,
            'nidn' => $request->nidn,
            'faculty' => $request->faculty,
            'study_program' => $request->study_program,
            'phone' => $request->phone,
            'is_active' => false, // Will be activated after approval
        ]);

        event(new Registered($user));

        // Notify LPPM admins from the same university for Researcher approval
        $lppmAdmins = User::where('university_id', $request->university_id)
            ->whereHas('role', function ($q) {
                $q->where('name', Role::ADMIN_KAMPUS);
            })
            ->where('is_active', true)
            ->get();

        foreach ($lppmAdmins as $admin) {
            // TODO: Send notification - NewResearcherRegistrationNotification
        }

        // Don't auto-login - user must wait for approval
        return redirect()->route('login')->with(
            'status',
            'Pendaftaran berhasil! Akun Peneliti Anda sedang menunggu verifikasi dan persetujuan dari Admin LPPM kampus Anda.'
        );
    }
}
