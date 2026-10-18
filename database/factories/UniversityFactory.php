<?php

namespace Database\Factories;

use App\Models\University;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<University>
 */
class UniversityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->lexify('?????'),
            'name' => $this->faker->company(),
            'address' => $this->faker->address(),
            'logo' => null,
            'contact_email' => $this->faker->unique()->safeEmail(),
        ];
    }
}
