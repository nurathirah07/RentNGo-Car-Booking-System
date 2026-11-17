<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Vehicle;
use App\Services\VehicleSummary;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public landing page. Read-only: it shows the most booked cars and the
 * categories so visitors see the real fleet before they sign up.
 */
class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('welcome', [
            'popularCars' => Vehicle::query()
                ->with('category:id,name')
                ->withCount(['bookings', 'reviews'])
                ->withAvg('reviews', 'rating')
                ->where('status', 'available')
                ->orderByDesc('bookings_count')
                ->orderBy('price_per_day')
                ->take(6)
                ->get()
                ->map(fn (Vehicle $vehicle) => VehicleSummary::card($vehicle)),
            'categories' => Category::query()
                ->withCount(['vehicles' => fn ($query) => $query->where('status', 'available')])
                ->withMin(['vehicles' => fn ($query) => $query->where('status', 'available')], 'price_per_day')
                ->orderBy('name')
                ->get()
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'cars' => $category->vehicles_count,
                    'from_price' => $category->getAttribute('vehicles_min_price_per_day') !== null
                        ? (float) $category->getAttribute('vehicles_min_price_per_day')
                        : null,
                ]),
            'today' => today()->toDateString(),
        ]);
    }
}
