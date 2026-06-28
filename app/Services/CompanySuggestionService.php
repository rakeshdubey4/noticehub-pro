<?php

namespace App\Services;

use App\Models\Notice;

class CompanySuggestionService
{
    /**
     * Return company suggestions for autocomplete.
     */
    public function suggestions(string $search = '', int $limit = 10)
    {
        return Notice::query()
            ->select('company_name')
            ->when($search, function ($query) use ($search) {
                $query->where('company_name', 'like', '%' . trim($search) . '%');
            })
            ->distinct()
            ->orderBy('company_name')
            ->limit($limit)
            ->pluck('company_name')
            ->values();
    }

    /**
     * Find the closest matching company name.
     * Returns null if confidence is too low.
     */
    public function didYouMean(string $input): ?string
    {
        $companies = Notice::query()
            ->distinct()
            ->pluck('company_name');

        $bestMatch = null;
        $bestScore = 0;

        foreach ($companies as $company) {

            similar_text(
                strtoupper($input),
                strtoupper($company),
                $percent
            );

            if ($percent > $bestScore) {
                $bestScore = $percent;
                $bestMatch = $company;
            }
        }

        // Suggest only when confidence is high enough
        return $bestScore >= 85 ? $bestMatch : null;
    }
}