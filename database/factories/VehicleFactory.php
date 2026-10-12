<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vehicle>
 */
class VehicleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'brand' => fake()->randomElement(['Perodua', 'Proton', 'Honda', 'Toyota']),
            'model' => fake()->word(),
            'year' => fake()->numberBetween(2018, 2025),
            'plate_number' => fake()->unique()->bothify('???? ####'),
            'color' => fake()->safeColorName(),
            'transmission' => fake()->randomElement(Vehicle::TRANSMISSIONS),
            'fuel_type' => fake()->randomElement(Vehicle::FUEL_TYPES),
            'seats' => 5,
            'price_per_day' => fake()->numberBetween(80, 500),
            'description' => fake()->sentence(),
            'status' => 'available',
        ];
    }
}
