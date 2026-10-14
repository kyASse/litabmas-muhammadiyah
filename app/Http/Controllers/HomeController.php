<?php

namespace App\Http\Controllers;

use App\Services\PublicHomeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        protected PublicHomeService $homeService
    ) {}

    /**
     * Display the welcome page or redirect authenticated users to dashboard.
     */
    public function index(Request $request): Response
    {
        $overallStats = $this->homeService->getOverallStats();
        $activeSchemas = $this->homeService->getActiveSchemas();

        return Inertia::render('welcome', [
            'overallStats' => $overallStats,
            'activeSchemas' => $activeSchemas,
        ]);
    }
}
