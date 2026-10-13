<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The page everyone lands on after login.
 * Admins are sent to the admin dashboard; customers see their own trips.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return to_route('admin.dashboard');
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'upcoming' => $user->bookings()->active()->whereDate('return_date', '>=', today())->count(),
                'completed' => $user->bookings()->where('status', 'completed')->count(),
                'total' => $user->bookings()->count(),
            ],
            'upcomingBookings' => $user->bookings()
                ->active()
                ->whereDate('return_date', '>=', today())
                ->with('vehicle')
                ->orderBy('pickup_date')
                ->take(3)
                ->get()
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'ref' => $booking->booking_ref,
                    'vehicle' => $booking->vehicle->full_name,
                    'image_url' => $booking->vehicle->image_url,
                    'pickup' => $booking->pickup_date->format('d M Y'),
                    'pickup_time' => $booking->pickupTimeLabel(),
                    'return' => $booking->return_date->format('d M Y'),
                    'pickup_location' => $booking->pickup_location,
                    'status' => $booking->status,
                    'total_days' => $booking->total_days,
                    // 0 = today, 3 = in three days; negative while the trip is under way
                    'starts_in_days' => (int) today()->diffInDays($booking->pickup_date, false),
                ]),
            'profileComplete' => $user->hasCompleteProfile(),
        ]);
    }
}
