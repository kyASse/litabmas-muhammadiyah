<?php

namespace App\Services;

use App\Models\Proposal;
use App\Models\ResearchOutput;
use App\Models\ResearchSchema;
use App\Models\University;
use Illuminate\Support\Facades\Cache;

class PublicHomeService
{
    /**
     * Get overall statistics for Litabmas research system.
     */
    public function getOverallStats(): array
    {
        return Cache::remember('home_overall_stats', now()->addHours(6), function () {
            return [
                'totalUniversities' => University::count(),
                'totalSchemas' => ResearchSchema::where('is_active', true)->count(),
                'totalProposals' => Proposal::count(),
                'totalOutputs' => ResearchOutput::count(),
            ];
        });
    }

    /**
     * Get active research schemas.
     */
    public function getActiveSchemas(int $limit = 6)
    {
        return Cache::remember('home_active_schemas', now()->addHours(6), function () use ($limit) {
            return ResearchSchema::with('university')
                ->where('is_active', true)
                ->latest()
                ->limit($limit)
                ->get();
        });
    }
}
