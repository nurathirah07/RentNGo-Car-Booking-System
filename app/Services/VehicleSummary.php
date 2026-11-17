<?php

namespace App\Services;

use App\Models\Vehicle;

/**
 * The shape of a car card (browse page, landing page, saved cars), built in one place
 * so every list sends the same fields to the browser.
 *
 * Load the car with category, withCount('bookings'), withAvg('reviews', 'rating')
 * and withCount('reviews') first, or the rating and "Popular" tag fall back to empty.
 */
class VehicleSummary
{
    /**
     * @return array{id: int, name: string, year: int, category: string, transmission: string, fuel_type: string, seats: int, price_per_day: float, image_url: string|null, status: string, is_popular: bool, rating: float|null, reviews_count: int}
     */
    public static function card(Vehicle $vehicle): array
    {
        $average = $vehicle->getAttribute('reviews_avg_rating');

        return [
            'id' => $vehicle->id,
            'name' => $vehicle->full_name,
            'year' => $vehicle->year,
            'category' => $vehicle->category->name,
            'transmission' => $vehicle->transmission,
            'fuel_type' => $vehicle->fuel_type,
            'seats' => $vehicle->seats,
            'price_per_day' => (float) $vehicle->price_per_day,
            'image_url' => $vehicle->image_url,
            'status' => $vehicle->status,
            'is_popular' => (int) $vehicle->getAttribute('bookings_count') >= 2,
            'rating' => $average !== null ? round((float) $average, 1) : null,
            'reviews_count' => (int) $vehicle->getAttribute('reviews_count'),
        ];
    }
}
