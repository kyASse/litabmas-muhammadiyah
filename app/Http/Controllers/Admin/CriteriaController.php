<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCriteriaRequest;
use App\Http\Requests\Admin\UpdateCriteriaRequest;
use App\Models\AssessmentCriteria;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CriteriaController - Super Admin / Admin Bappeda
 *
 * Mengelola Master Kriteria Penilaian: Checklist Seleksi Administrasi
 * Dinamis dan Rubrik Evaluasi Substansi Proposal Riset.
 *
 * @route /admin/criteria/*
 */
class CriteriaController extends Controller
{
    /**
     * Tampilkan daftar kriteria penilaian.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, '[DITOLAK] Hanya Super Admin yang memiliki hak akses kriteria penilaian.');
        }

        $query = AssessmentCriteria::query();

        if ($request->filled('tahap_seleksi')) {
            $query->where('tahap_seleksi', $request->tahap_seleksi);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('tipe_jawaban')) {
            $query->where('tipe_jawaban', $request->tipe_jawaban);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_kriteria', 'like', "%{$search}%")
                    ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        $criteria = $query
            ->orderBy('tahap_seleksi')
            ->orderBy('urutan')
            ->orderBy('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Criteria/Index', [
            'criteria' => $criteria,
            'filters' => $request->only(['tahap_seleksi', 'is_active', 'tipe_jawaban', 'search']),
        ]);
    }

    /**
     * Simpan kriteria baru ke basis data.
     */
    public function store(StoreCriteriaRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if (! isset($validated['urutan'])) {
            $maxOrder = AssessmentCriteria::where('tahap_seleksi', $validated['tahap_seleksi'])->max('urutan') ?? 0;
            $validated['urutan'] = $maxOrder + 1;
        }

        $criterion = AssessmentCriteria::create($validated);

        return redirect()
            ->route('admin.criteria.index')
            ->with('success', "Kriteria penilaian \"{$criterion->nama_kriteria}\" berhasil ditambahkan.");
    }

    /**
     * Perbarui kriteria yang ditentukan.
     */
    public function update(UpdateCriteriaRequest $request, AssessmentCriteria $criterion): RedirectResponse
    {
        $criterion->update($request->validated());

        return redirect()
            ->route('admin.criteria.index')
            ->with('success', "Kriteria penilaian \"{$criterion->nama_kriteria}\" berhasil diperbarui.");
    }

    /**
     * Hapus kriteria dari basis data.
     */
    public function destroy(Request $request, AssessmentCriteria $criterion): RedirectResponse
    {
        $user = $request->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, '[DITOLAK] Hanya Super Admin yang berhak menghapus kriteria.');
        }

        $nama = $criterion->nama_kriteria;
        $criterion->delete();

        return redirect()
            ->route('admin.criteria.index')
            ->with('success', "Kriteria penilaian \"{$nama}\" berhasil dihapus.");
    }
}
