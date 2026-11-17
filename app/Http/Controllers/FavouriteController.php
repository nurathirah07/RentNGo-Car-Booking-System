<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Services\VehicleSummary;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Cars a customer saved with the heart button.
 * The saved IDs are shared with every page (HandleInertiaRequests), so hearts show everywhere.
 */
class FavouriteController extends Controller
{
    public function index(Request $request): Response
    {
        $vehicles = $request->user()->favourites()
            ->where('status', '!=', 'inactive')
            ->with('category:id,name')
            ->withCount('bookings')
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->orderByPivot('created_at', 'desc')
            ->get()
            ->map(fn (Vehicle $vehicle) => VehicleSummary::card($vehicle));

        return Inertia::render('cars/saved', [
            'vehicles' => $vehicles,
        ]);
    }

    /** Save the car, or remove it if it was already saved. */
    public function toggle(Request $request, Vehicle $vehicle): RedirectResponse
    {
        abort_if($vehicle->status === 'inactive', 404);

        $request->user()->favourites()->toggle($vehicle->id);

        return back();
    }
}
