<?php

use App\Http\Controllers\Admin\AdminKampusController;
use App\Http\Controllers\Admin\AssignController as AdminAssignController;
use App\Http\Controllers\Admin\CriteriaController as AdminCriteriaController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DecisionController as AdminDecisionController;
use App\Http\Controllers\Admin\LogController as AdminLogController;
use App\Http\Controllers\Admin\MonevReportController as AdminMonevReportController;
use App\Http\Controllers\Admin\MonevScheduleCtrl as AdminMonevScheduleCtrl;
use App\Http\Controllers\Admin\OutputReportController as AdminOutputReportController;
use App\Http\Controllers\Admin\OutputVerifyController as AdminOutputVerifyController;
use App\Http\Controllers\Admin\ProposalController as AdminProposalController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\SettingsCtrl as AdminSettingsCtrl;
use App\Http\Controllers\Admin\SktsController;
use App\Http\Controllers\Admin\UniversityController as AdminUniversityController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\UserRoleController as AdminUserRoleController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractDocController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\FinanceReportController;
use App\Http\Controllers\FundingController;
use App\Http\Controllers\FundingLogController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MonevDocumentController;
use App\Http\Controllers\OutputController;
use App\Http\Controllers\OutputDocController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\Review\ReviewSummaryController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ReviewDocumentController;
use App\Http\Controllers\Reviewer\MonevEvaluationController;
use App\Http\Controllers\ReviewerController;
use App\Http\Controllers\ReviewHistoryController;
use App\Http\Controllers\SchemaController;
use App\Http\Controllers\User\UserFundingController;
use App\Models\Role;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

/*
|--------------------------------------------------------------------------
| Public Storage File Serving
|--------------------------------------------------------------------------
|
| Serves files stored on the "public" disk (storage/app/public/).
| Bypasses directory junctions on Windows when running artisan serve.
*/
Route::get('/storage/{path}', function (string $path) {
    if (str_contains($path, '..') || str_contains($path, '\\') || str_starts_with($path, '/')) {
        abort(400);
    }

    try {
        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('public')->path($path));
    } catch (Throwable $e) {
        abort(404);
    }
})->where('path', '.+')->name('storage.serve');

// Home / Landing Page
Route::get('/', [HomeController::class, 'index'])->name('home');

// Design System Preview Gate (Hybrid Scholarly Enterprise Showcase)
Route::get('/design-system-preview', function () {
    return inertia('DesignSystemPreview');
})->name('design-system-preview');

// Google OAuth
Route::middleware('guest')->group(function () {
    Route::get('/auth/google', [SocialAuthController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    // Dashboard redirection / general dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Profile Routes
    Route::prefix('profile')->name('author-profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'show'])->name('show');
        Route::post('/', [ProfileController::class, 'update'])->name('update');
    });

    // Review Summary & Print
    Route::get('proposals/{proposal}/summary', [ReviewSummaryController::class, 'index'])->name('review.summary.index');
    Route::get('/review/print/{type}/{id}', [ReviewDocumentController::class, 'print'])->name('review.print');
    Route::get('/proposal/review-history/{dosen?}', [ReviewHistoryController::class, 'index'])->name('proposal.review-history');

    // Proposal Document Downloads
    Route::get('/proposals/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::get('/proposals/{proposal}/download', [ProposalController::class, 'downloadDocument'])->name('proposals.download');

    // SKTS Certificate & Evaluation
    Route::get('/evaluations/show', [EvaluationController::class, 'show'])->name('evaluations.show.query');
    Route::get('/evaluations/my-final-report', [EvaluationController::class, 'show'])->name('evaluations.my-final-report');
    Route::get('/proposals/{proposal}/final-evaluation', [EvaluationController::class, 'show'])->name('evaluations.show');
    Route::get('/proposals/{proposal}/skts-certificate', [EvaluationController::class, 'certificate'])->name('evaluations.certificate');
    Route::get('/proposals/{proposal}/skts', [EvaluationController::class, 'certificate'])->name('evaluations.skts.show');

    /*
    |--------------------------------------------------------------------------
    | Grup Peneliti / Dosen (PRD Bab 7.1)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:Peneliti,Dosen,User'])->group(function () {
        // Proposals CRUD
        Route::get('/proposals', [ProposalController::class, 'index'])->name('proposals.index');
        Route::get('/proposal', [ProposalController::class, 'index'])->name('proposal.index');
        Route::get('/proposals/create', [ProposalController::class, 'create'])->name('proposals.create');
        Route::get('/proposal/create', [ProposalController::class, 'create'])->name('proposal.create');
        Route::post('/proposals', [ProposalController::class, 'store'])->name('proposals.store');
        Route::post('/proposal', [ProposalController::class, 'store'])->name('proposal.store');
        Route::get('/proposals/{proposal}', [ProposalController::class, 'show'])->name('proposals.show');
        Route::get('/proposal/{proposal}', [ProposalController::class, 'show'])->name('proposal.show');
        Route::get('/proposals/{proposal}/edit', [ProposalController::class, 'edit'])->name('proposals.edit');
        Route::get('/proposal/{proposal}/edit', [ProposalController::class, 'edit'])->name('proposal.edit');
        Route::put('/proposals/{proposal}', [ProposalController::class, 'update'])->name('proposals.update');
        Route::put('/proposal/{proposal}', [ProposalController::class, 'update'])->name('proposal.update');
        Route::delete('/proposals/{proposal}', [ProposalController::class, 'destroy'])->name('proposals.destroy');
        Route::delete('/proposal/{proposal}', [ProposalController::class, 'destroy'])->name('proposal.destroy');
        Route::post('/proposals/{proposal}/submit-kampus', [ProposalController::class, 'submitKampus'])->name('proposals.submit-kampus');
        Route::post('/proposal/{proposal}/submit-kampus', [ProposalController::class, 'submitKampus'])->name('proposal.submit-kampus');
        Route::get('/proposal/documents/{document}/download', [DocumentController::class, 'download'])->name('proposal.documents.download');

        // Document Upload
        Route::post('/proposals/{proposal}/documents', [DocumentController::class, 'upload'])->name('documents.store');
        Route::post('/documents/upload', [DocumentController::class, 'upload'])->name('documents.upload');

        // Progress Reports (Monev)
        Route::get('/progress', [ProgressController::class, 'index'])->name('progress.index');
        Route::get('/progress/create', [ProgressController::class, 'create'])->name('progress.create');
        Route::post('/progress', [ProgressController::class, 'store'])->name('progress.store');
        Route::get('/progress/{progressReport}', [ProgressController::class, 'show'])->name('progress.show');

        // Research Outputs (Luaran Penelitian)
        Route::get('/outputs', [OutputController::class, 'index'])->name('outputs.index');
        Route::get('/outputs/create', [OutputController::class, 'create'])->name('outputs.create');
        Route::post('/outputs', [OutputController::class, 'store'])->name('outputs.store');
        Route::get('/outputs/{output}/edit', [OutputController::class, 'edit'])->name('outputs.edit');
        Route::put('/outputs/{output}', [OutputController::class, 'update'])->name('outputs.update');
        Route::delete('/outputs/{output}', [OutputController::class, 'destroy'])->name('outputs.destroy');

        Route::post('/outputs/products/{product}/upload', [OutputDocController::class, 'upload'])->name('outputs.products.upload-doc');
        Route::delete('/outputs/products/{product}/upload', [OutputDocController::class, 'destroy'])->name('outputs.products.delete-doc');

        // Final Report / Evaluation Submission
        Route::post('/proposals/{proposal}/final-evaluation', [EvaluationController::class, 'store'])->name('evaluations.store');

        // Funding Info for Peneliti
        Route::get('/funding', [UserFundingController::class, 'index'])->name('funding.index');
        Route::get('/user/funding', [UserFundingController::class, 'index'])->name('user.funding.index');
    });

    /*
    |--------------------------------------------------------------------------
    | Grup Reviewer (PRD Bab 7.2)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:'.Role::REVIEWER])->prefix('reviewer')->name('reviewer.')->group(function () {
        Route::get('/dashboard', [ReviewerController::class, 'index'])->name('dashboard');
        Route::get('/assignments', [ReviewerController::class, 'assignments'])->name('assignments.index');
        Route::get('/assignments/{assignment}', [ReviewerController::class, 'show'])->name('assignments.show');
        Route::get('/assignments/{assignment}/review', [ReviewerController::class, 'reviewForm'])->name('assignments.review-form');
        Route::post('/assignments/{assignment}/review', [ReviewerController::class, 'submitReview'])->name('assignments.submit-review');
        Route::get('/assignments/{reviewId}/attachments/{attachmentId}', [ReviewerController::class, 'downloadAttachment'])->name('assignments.download');

        // Proposals Review & Assessment
        Route::get('/proposals/{id}', [ReviewController::class, 'show'])->name('proposals.show');
        Route::post('/proposals/{id}/assessment', [ReviewController::class, 'storeAssessment'])->name('proposals.assessment');
        Route::put('/proposals/{id}/assessment', [ReviewController::class, 'updateAssessment'])->name('proposals.assessment.update');
        Route::post('/assessment', [ReviewController::class, 'storeAssessment'])->name('assessment.store');
        Route::put('/assessment/{id}', [ReviewController::class, 'updateAssessment'])->name('assessment.update');

        // Monev & Evaluation
        Route::get('/monev/{report}/evaluate', [MonevEvaluationController::class, 'show'])->name('monev.show');
        Route::post('/monev/{report}/evaluate', [MonevEvaluationController::class, 'evaluate'])->name('monev.evaluate');
        Route::post('/monev/{id}', [MonevEvaluationController::class, 'evaluate'])->name('monev.evaluate.legacy');
        Route::get('/evaluations', [EvaluationController::class, 'index'])->name('evaluations.index');
        Route::get('/evaluations/{report}', [EvaluationController::class, 'showProgress'])->name('evaluations.show');
        Route::post('/evaluations/{id}', [EvaluationController::class, 'evaluateFinal'])->name('evaluations.evaluate-final');
    });

    /*
    |--------------------------------------------------------------------------
    | Grup Admin Keuangan (PRD Bab 7.3)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:'.Role::ADMIN_KEUANGAN.','.Role::ADMIN_KAMPUS.','.Role::SUPER_ADMIN])->prefix('finance')->name('finance.')->group(function () {
        // Contracts
        Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
        Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');
        Route::post('/contracts/generate', [ContractController::class, 'generate'])->name('contracts.generate');
        Route::get('/contracts/{contract}', [ContractController::class, 'show'])->name('contracts.show');
        Route::post('/contracts/{contract}/update-status', [ContractController::class, 'updateStatus'])->name('contracts.update-status');

        // Contract Documents
        Route::prefix('contracts')->name('contracts.')->group(function () {
            Route::get('{contract}/upload', [ContractDocController::class, 'create'])->name('upload');
            Route::post('documents', [ContractDocController::class, 'store'])->name('documents.store');
            Route::get('documents/{document}/download', [ContractDocController::class, 'download'])->name('documents.download');
        });

        // Fundings
        Route::get('/fundings', [FundingController::class, 'index'])->name('fundings.index');
        Route::get('/contracts/{contract}/funding/create', [FundingController::class, 'create'])->name('funding.create');
        Route::post('/funding/store-termin', [FundingController::class, 'storeTermin'])->name('funding.store-termin');
        Route::post('/fundings/{id}/disburse', [FundingController::class, 'disburse'])->name('funding.disburse');
        Route::post('/funding/{funding}/upload-bukti', [FundingController::class, 'uploadBukti'])->name('funding.upload-bukti');
        Route::get('/funding/{id}/print', [FundingController::class, 'printKwitansi'])->name('funding.print-kwitansi');
        Route::get('/funding/logs', [FundingLogController::class, 'index'])->name('funding.logs.index');

        // Finance Reports
        Route::get('/reports', [FinanceReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/summary', [FinanceReportController::class, 'summary'])->name('reports.summary');
        Route::post('/reports/filter', [FinanceReportController::class, 'filter'])->name('reports.filter');
    });

    // Contract & Funding Route Aliases (Ziggy & Backward Compatibility)
    Route::middleware(['role:'.Role::ADMIN_KEUANGAN.','.Role::ADMIN_KAMPUS.','.Role::SUPER_ADMIN])->group(function () {
        Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
        Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');
        Route::get('/contracts/{contract}', [ContractController::class, 'show'])->name('contracts.show');
        Route::post('/contracts/{contract}/update-status', [ContractController::class, 'updateStatus'])->name('contracts.update-status');
        Route::post('/funding/{id}/disburse', [FundingController::class, 'disburse'])->name('funding.disburse');
        Route::post('/funding/{funding}/upload-bukti', [FundingController::class, 'uploadBukti'])->name('funding.upload-bukti');
        Route::get('/funding/{id}/print', [FundingController::class, 'printKwitansi'])->name('funding.print-kwitansi');
    });

    /*
    |--------------------------------------------------------------------------
    | Grup Admin Kampus / LPPM (PRD Bab 7.4)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:'.Role::ADMIN_KAMPUS.','.Role::SUPER_ADMIN])->prefix('admin')->name('admin.')->group(function () {
        // Schemas Management
        Route::get('/schemas', [SchemaController::class, 'index'])->name('schemas.index');
        Route::post('/schemas', [SchemaController::class, 'store'])->name('schemas.store');
        Route::resource('schema', SchemaController::class);

        // Proposals Verification & Management
        Route::prefix('proposals')->name('proposals.')->group(function () {
            Route::get('/', [AdminProposalController::class, 'index'])->name('index');
            Route::get('{proposal}', [AdminProposalController::class, 'show'])->name('show');
            Route::post('{proposal}/verify', [AdminProposalController::class, 'approve'])->name('verify');
            Route::post('{proposal}/approve', [AdminProposalController::class, 'approve'])->name('approve');
            Route::post('{proposal}/reject', [AdminProposalController::class, 'reject'])->name('reject');
            Route::post('{proposal}/campus-approve', [AdminProposalController::class, 'campusApprove'])->name('campus-approve');
            Route::post('{proposal}/campus-reject', [AdminProposalController::class, 'campusReject'])->name('campus-reject');
            Route::post('{proposal}/verify-administration', [AdminProposalController::class, 'verifyAdministration'])->name('verify-administration');
        });

        // Reviewer Assignment
        Route::get('reviewer/assign', [AdminAssignController::class, 'index'])->name('reviewer.assign');
        Route::post('assign', [AdminAssignController::class, 'assign'])->name('assign.store');
        Route::post('assign/{id}/reassign', [AdminAssignController::class, 'reassign'])->name('assign.reassign');
        Route::delete('assign/{id}', [AdminAssignController::class, 'unassign'])->name('assign.unassign');

        // Decision
        Route::post('decision/decide', [AdminDecisionController::class, 'decide'])->name('decision.decide');

        // Review Summary
        Route::get('reviews/summary', [AdminReviewController::class, 'summary'])->name('reviews.summary');

        // Monev Report & Management
        Route::get('/monev', [AdminMonevReportController::class, 'index'])->name('monev.index');
        Route::get('monev/rekap-keseluruhan', [AdminMonevReportController::class, 'index'])->name('monev.rekap-keseluruhan');
        Route::post('monev/decide-action', [AdminMonevReportController::class, 'decideAction'])->name('monev.decide-action');
        Route::get('monev/print', [MonevDocumentController::class, 'printRekap'])->name('monev.print');

        // Monev Schedules
        Route::prefix('monev-schedules')->name('monev-schedules.')->group(function () {
            Route::get('/', [AdminMonevScheduleCtrl::class, 'index'])->name('index');
            Route::post('/', [AdminMonevScheduleCtrl::class, 'store'])->name('store');
            Route::get('pending', [AdminMonevScheduleCtrl::class, 'pending'])->name('pending');
        });

        // Output Verification & Reports
        Route::prefix('outputs')->name('outputs.')->group(function () {
            Route::get('/', [AdminOutputVerifyController::class, 'index'])->name('index');
            Route::get('/verify', [AdminOutputVerifyController::class, 'index'])->name('verify-page');
            Route::post('{output}/verify', [AdminOutputVerifyController::class, 'verify'])->name('verify');
        });
        Route::post('/outputs/{output}/verify', [AdminOutputVerifyController::class, 'verify'])->name('outputs.verify');
        Route::prefix('output-verify')->name('output-verify.')->group(function () {
            Route::get('/', [AdminOutputVerifyController::class, 'index'])->name('index');
            Route::post('{output}', [AdminOutputVerifyController::class, 'verify'])->name('verify');
        });
        Route::post('/output/{output}/verify', [AdminOutputVerifyController::class, 'verify'])->name('output.verify');
        Route::get('output/report', [AdminOutputReportController::class, 'index'])->name('output.report');
        Route::get('output/export', [AdminOutputReportController::class, 'export'])->name('output.export');

        // SKTS & Final Evaluation Management
        Route::get('/evaluations', [EvaluationController::class, 'show'])->name('evaluations.index');
        Route::get('/evaluations/show', [EvaluationController::class, 'show'])->name('evaluations.show');
        Route::get('/evaluations/{proposal}', [EvaluationController::class, 'show'])->name('evaluations.proposal.show');
        Route::get('/proposals/{proposal}/evaluate', [EvaluationController::class, 'show'])->name('proposals.evaluate.show');
        Route::get('/proposals/{proposal}/final-evaluation', [EvaluationController::class, 'show'])->name('proposals.final-evaluation.show');
        Route::post('/proposals/{proposal}/evaluate', [SktsController::class, 'evaluate'])->name('proposals.evaluate');
        Route::post('/proposals/{proposal}/skts', [SktsController::class, 'generateSkts'])->name('proposals.skts');
        Route::post('/proposals/{proposal}/terminate', [SktsController::class, 'terminateForceMajeure'])->name('proposals.terminate');
        Route::post('/evaluations/{proposal}/certify', [SktsController::class, 'generateSkts'])->name('evaluations.certify');

        // Dashboard Admin Kampus / LPPM
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    });

    /*
    |--------------------------------------------------------------------------
    | Grup Super Admin (PRD Bab 7.5)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:'.Role::SUPER_ADMIN])->prefix('admin')->name('admin.')->group(function () {
        // Universities Management
        Route::resource('universities', AdminUniversityController::class);
        Route::post('universities/{university}/toggle-active', [AdminUniversityController::class, 'toggleActive'])
            ->name('universities.toggle-active');

        // Admin Kampus Management
        Route::resource('admin-kampus', AdminKampusController::class);
        Route::post('admin-kampus/{admin_kampus}/toggle-active', [AdminKampusController::class, 'toggleActive'])
            ->name('admin-kampus.toggle-active');

        // Users Management
        Route::resource('users', AdminUserController::class);
        Route::post('users/{user}/toggle-active', [AdminUserController::class, 'toggleActive'])
            ->name('users.toggle-active');
        Route::delete('users/revoke/{id}', [AdminUserRoleController::class, 'revoke'])
            ->name('users.revoke');

        // System Logs & Settings
        Route::resource('criteria', AdminCriteriaController::class);
        Route::get('/logs', [AdminLogController::class, 'index'])->name('logs.index');
        Route::get('/settings', [AdminSettingsCtrl::class, 'index'])->name('settings.index');
        Route::post('/settings', [AdminSettingsCtrl::class, 'update'])->name('settings.update');
        Route::get('settings/profile', [AdminSettingsCtrl::class, 'index'])->name('settings.profile');
        Route::post('settings/profile', [AdminSettingsCtrl::class, 'update'])->name('settings.profile.update');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
