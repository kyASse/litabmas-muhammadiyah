<?php

namespace Database\Factories;

use App\Models\Proposal;
use App\Models\ResearchOutput;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ResearchOutput>
 */
class ResearchOutputFactory extends Factory
{
    protected $model = ResearchOutput::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_proposal' => Proposal::factory(),
            'tipe_luaran' => $this->faker->randomElement(['Journal', 'Book', 'Hki', 'Product']),
            'target_status' => $this->faker->randomElement(['Wajib', 'Tambahan']),
            'status_verifikasi' => 'Draft',
            'catatan_verifikasi' => null,
            'tanggal_pelaporan' => now(),
        ];
    }
}
