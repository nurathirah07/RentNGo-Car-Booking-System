<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = today()->toDateString();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'totalVehicles' => Vehicle::count(),
                'availableNow' => Vehicle::availableBetween($today, $today)->count(),
                'customers' => User::where('role', 'customer')->count(),
                'pendingBookings' => Booking::where('status', 'pending')->count(),
                'activeBookings' => Booking::active()->count(),
                'revenue' => (float) Payment::where('status', 'paid')->sum('amount'),
            ],
            'recentBookings' => Booking::with(['user:id,name', 'vehicle:id,brand,model,plate_number'])
                ->latest()
                ->take(5)
                ->get()
                ->map(fn (Booking $b) => [
                    'id' => $b->id,
                    'ref' => $b->booking_ref,
                    'customer' => $b->user->name,
                    'vehicle' => $b->vehicle->brand.' '.$b->vehicle->model,
                    'plate' => $b->vehicle->plate_number,
                    'pickup' => $b->pickup_date->format('d M Y'),
                    'return' => $b->return_date->format('d M Y'),
                    'amount' => (float) $b->total_amount,
                    'status' => $b->status,
                ]),
        ]);
    }
}
