<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $pickup = today()->addDays(fake()->numberBetween(1, 30));

        return [
            'booking_ref' => fake()->unique()->bothify('RNG-########-####'),
            'user_id' => User::factory(),
            'vehicle_id' => Vehicle::factory(),
            'pickup_date' => $pickup->toDateString(),
            'pickup_time' => '10:00',
            'return_date' => $pickup->copy()->addDays(2)->toDateString(),
            'pickup_location' => 'RentNGo HQ, Shah Alam',
            'total_days' => 3,
            'price_per_day' => 100,
            'total_amount' => 300,
            'status' => 'pending',
        ];
    }

    /**
     * Book the car from $pickupDate to $returnDate (inclusive), e.g. ->between('2026-10-12', '2026-10-14').
     */
    public function between(string $pickupDate, string $returnDate): static
    {
        return $this->state(fn (array $attributes) => [
            'pickup_date' => $pickupDate,
            'return_date' => $returnDate,
            'total_days' => Booking::countDays($pickupDate, $returnDate),
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'confirmed']);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'completed']);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'cancelled']);
    }
}
