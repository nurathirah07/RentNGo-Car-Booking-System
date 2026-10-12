<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'amount' => 300,
            'method' => 'Cash',
            'status' => 'pending',
        ];
    }

    /**
     * Indicate that the payment has been received.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'transaction_ref' => fake()->bothify('FPX##########'),
            'paid_at' => now(),
        ]);
    }
}
