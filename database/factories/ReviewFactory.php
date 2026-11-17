<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * A review for a completed booking; the user and car come from that booking.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory()->completed(),
            'user_id' => fn (array $attributes) => Booking::whereKey($attributes['booking_id'])->value('user_id'),
            'vehicle_id' => fn (array $attributes) => Booking::whereKey($attributes['booking_id'])->value('vehicle_id'),
            'rating' => fake()->numberBetween(3, 5),
            'comment' => fake()->sentence(),
        ];
    }
}
