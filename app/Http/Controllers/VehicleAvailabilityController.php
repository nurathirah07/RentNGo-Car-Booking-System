<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckAvailabilityRequest;
use App\Models\Vehicle;
use App\Services\BookingPricing;
use Illuminate\Http\JsonResponse;

/**
 * The "real-time" availability check.
 *
 * The booking page calls this JSON endpoint (with Inertia's useHttp hook) every time
 * the customer changes the dates, so they see "Available" / "Already booked" and the
 * price BEFORE they submit. It only reads data; the final check happens again
 * when the booking is saved, because someone else could book in the meantime.
 */
class VehicleAvailabilityController extends Controller
{
    public function __invoke(CheckAvailabilityRequest $request, Vehicle $vehicle): JsonResponse
    {
        $pickupDate = $request->validated('pickup_date');
        $returnDate = $request->validated('return_date');

        $isAvailable = $vehicle->isAvailableBetween($pickupDate, $returnDate);
        $price = BookingPricing::quote($vehicle->loadMissing('category'), $pickupDate, $returnDate);

        return response()->json([
            'available' => $isAvailable,
            'total_days' => $price['days'],
            'subtotal_amount' => $price['subtotal'],
            'discount_amount' => $price['discount'],
            'total_amount' => $price['total'],
            'deposit_amount' => $price['deposit'],
            'message' => match (true) {
                $isAvailable => 'This car is available for your dates.',
                $vehicle->status !== 'available' => 'This car is not available for rent right now.',
                default => 'This car is already booked for some of these dates. Please choose different dates.',
            },
        ]);
    }
}
