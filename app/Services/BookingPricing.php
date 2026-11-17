<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Vehicle;

/**
 * All the money rules for a rental, in one place, so the live price check,
 * the booking itself and the receipt always agree.
 *
 *  - Rental: days x daily price (pickup and return day both count)
 *  - Weekly discount: 10% off the rental for 7 days or more
 *  - Refundable deposit: RM 500 for Luxury cars, RM 200 for others, paid at pickup
 *  - Late return: each late day costs 1.5x the daily price, taken from the deposit
 */
class BookingPricing
{
    public const WEEKLY_DISCOUNT_DAYS = 7;

    public const WEEKLY_DISCOUNT_RATE = 0.10;

    public const LATE_FEE_MULTIPLIER = 1.5;

    public const DEPOSIT_STANDARD = 200;

    public const DEPOSIT_LUXURY = 500;

    /**
     * The full price breakdown for renting $vehicle between two dates.
     *
     * @return array{days: int, price_per_day: float, subtotal: float, discount: float, total: float, deposit: float}
     */
    public static function quote(Vehicle $vehicle, string $pickupDate, string $returnDate): array
    {
        $days = Booking::countDays($pickupDate, $returnDate);
        $pricePerDay = (float) $vehicle->price_per_day;
        $subtotal = round($days * $pricePerDay, 2);
        $discount = $days >= self::WEEKLY_DISCOUNT_DAYS
            ? round($subtotal * self::WEEKLY_DISCOUNT_RATE, 2)
            : 0.0;

        return [
            'days' => $days,
            'price_per_day' => $pricePerDay,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => round($subtotal - $discount, 2),
            'deposit' => (float) self::depositFor($vehicle),
        ];
    }

    public static function depositFor(Vehicle $vehicle): int
    {
        return $vehicle->category->name === 'Luxury' ? self::DEPOSIT_LUXURY : self::DEPOSIT_STANDARD;
    }

    /** Late fee for a car returned $lateDays after its return date. */
    public static function lateFee(Booking $booking, int $lateDays): float
    {
        return round($lateDays * (float) $booking->price_per_day * self::LATE_FEE_MULTIPLIER, 2);
    }
}
