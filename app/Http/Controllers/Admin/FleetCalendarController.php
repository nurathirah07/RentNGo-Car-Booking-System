<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A timeline of the whole fleet: one row per car, one column per day,
 * with each booking drawn as a bar. ?start=2026-11-01 moves the window.
 */
class FleetCalendarController extends Controller
{
    /** Days shown at once. */
    public const DAYS = 14;

    public function __invoke(Request $request): Response
    {
        $validated = $request->validate(['start' => ['nullable', 'date_format:Y-m-d']]);

        $start = isset($validated['start']) ? Carbon::parse($validated['start'])->startOfDay() : today()->subDays(2);
        $end = $start->copy()->addDays(self::DAYS - 1);

        $vehicles = Vehicle::query()
            ->where('status', '!=', 'inactive')
            ->with(['bookings' => fn ($query) => $query
                ->whereIn('status', ['pending', 'confirmed', 'completed'])
                ->overlapping($start->toDateString(), $end->toDateString())
                ->with('user:id,name')
                ->orderBy('pickup_date'),
            ])
            ->orderBy('brand')
            ->orderBy('model')
            ->get()
            ->map(fn (Vehicle $vehicle) => [
                'id' => $vehicle->id,
                'name' => $vehicle->full_name,
                'plate' => $vehicle->plate_number,
                'status' => $vehicle->status,
                'bookings' => $vehicle->bookings->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'ref' => $booking->booking_ref,
                    'customer' => $booking->user->name,
                    'status' => $booking->status,
                    'pickup' => $booking->pickup_date->toDateString(),
                    'return' => $booking->return_date->toDateString(),
                    // Column where the bar starts (0 = first day shown) and how many columns it spans,
                    // clipped to the visible window.
                    'offset' => (int) $start->diffInDays($booking->pickup_date->max($start)),
                    'span' => (int) $booking->pickup_date->max($start)->diffInDays($booking->return_date->min($end)) + 1,
                ]),
            ]);

        return Inertia::render('admin/calendar', [
            'vehicles' => $vehicles,
            'days' => collect(range(0, self::DAYS - 1))->map(fn (int $offset) => [
                'date' => $start->copy()->addDays($offset)->toDateString(),
                'weekday' => $start->copy()->addDays($offset)->format('D'),
                'day' => $start->copy()->addDays($offset)->format('j'),
                'month' => $start->copy()->addDays($offset)->format('M'),
            ]),
            'start' => $start->toDateString(),
            'previous' => $start->copy()->subDays(7)->toDateString(),
            'next' => $start->copy()->addDays(7)->toDateString(),
            'today' => today()->toDateString(),
        ]);
    }
}
