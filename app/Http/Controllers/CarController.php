<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Category;
use App\Models\Payment;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Customer-facing car catalogue: browse cars and open one to book it.
 */
class CarController extends Controller
{
    /** Sort options on the Browse page (value => label shown in the dropdown). */
    public const SORTS = [
        'recommended' => 'Recommended',
        'price_asc' => 'Price: low to high',
        'price_desc' => 'Price: high to low',
        'newest' => 'Newest model',
    ];

    /**
     * Browse cars. Every filter is an optional query-string value, e.g.
     * /cars?pickup_date=2026-10-20&return_date=2026-10-22&category=1,3&transmission=Auto&max_price=200
     *
     * When the customer picks dates, only cars that are free for the WHOLE
     * period are listed (Vehicle::scopeAvailableBetween).
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'pickup_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:today'],
            'return_date' => ['nullable', 'required_with:pickup_date', 'date_format:Y-m-d', 'after_or_equal:pickup_date'],
            'search' => ['nullable', 'string', 'max:100'],
            // One or more category IDs, comma separated: "2" or "1,3"
            'category' => ['nullable', 'string', 'regex:/^\d+(,\d+)*$/'],
            'transmission' => ['nullable', Rule::in(Vehicle::TRANSMISSIONS)],
            'seats' => ['nullable', 'integer', 'between:2,15'], // minimum number of seats
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'sort' => ['nullable', Rule::in(array_keys(self::SORTS))],
            // "1" also lists cars that are in maintenance (shown greyed out, not bookable)
            'include_unavailable' => ['nullable', 'in:0,1'],
        ]);

        $hasDates = filled($filters['pickup_date'] ?? null) && filled($filters['return_date'] ?? null);
        $categoryIds = filled($filters['category'] ?? null) ? explode(',', $filters['category']) : [];
        $sort = $filters['sort'] ?? 'recommended';

        $vehicles = Vehicle::query()
            ->with('category:id,name')
            ->withCount('bookings') // used for the "Recommended" order and the "Popular" tag
            ->when(
                $hasDates,
                fn (Builder $query) => $query->availableBetween($filters['pickup_date'], $filters['return_date']),
                fn (Builder $query) => ($filters['include_unavailable'] ?? '0') === '1'
                    ? $query->whereIn('status', ['available', 'maintenance']) // never retired (inactive) cars
                    : $query->where('status', 'available'),
            )
            ->when(filled($filters['search'] ?? null), function (Builder $query) use ($filters) {
                $term = '%'.$filters['search'].'%';

                $query->where(function (Builder $query) use ($term) {
                    $query->where('brand', 'like', $term)
                        ->orWhere('model', 'like', $term)
                        ->orWhere('plate_number', 'like', $term);
                });
            })
            ->when($categoryIds !== [], fn (Builder $query) => $query->whereIn('category_id', $categoryIds))
            ->when(filled($filters['transmission'] ?? null), fn (Builder $query) => $query->where('transmission', $filters['transmission']))
            ->when(filled($filters['seats'] ?? null), fn (Builder $query) => $query->where('seats', '>=', $filters['seats']))
            ->when(filled($filters['min_price'] ?? null), fn (Builder $query) => $query->where('price_per_day', '>=', $filters['min_price']))
            ->when(filled($filters['max_price'] ?? null), fn (Builder $query) => $query->where('price_per_day', '<=', $filters['max_price']))
            ->tap(fn (Builder $query) => match ($sort) {
                'price_asc' => $query->orderBy('price_per_day'),
                'price_desc' => $query->orderByDesc('price_per_day'),
                'newest' => $query->orderByDesc('year')->orderBy('price_per_day'),
                default => $query->orderByDesc('bookings_count')->orderBy('price_per_day'), // most booked first
            })
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Vehicle $vehicle) => [
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
                'is_popular' => $vehicle->bookings_count >= 2,
            ]);

        return Inertia::render('cars/index', [
            'vehicles' => $vehicles,
            'filters' => [
                'pickup_date' => $filters['pickup_date'] ?? '',
                'return_date' => $filters['return_date'] ?? '',
                'search' => $filters['search'] ?? '',
                'category' => $filters['category'] ?? '',
                'transmission' => $filters['transmission'] ?? '',
                'seats' => (string) ($filters['seats'] ?? ''),
                'min_price' => (string) ($filters['min_price'] ?? ''),
                'max_price' => (string) ($filters['max_price'] ?? ''),
                'sort' => $filters['sort'] ?? '',
                'include_unavailable' => $filters['include_unavailable'] ?? '',
            ],
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'sorts' => self::SORTS,
            'priceStats' => $this->priceStats(),
            'today' => today()->toDateString(),
        ]);
    }

    /**
     * Pending/confirmed bookings of this car that haven't ended yet.
     *
     * @return Collection<int, Booking>
     */
    private function upcomingBookings(Vehicle $vehicle): Collection
    {
        return $vehicle->bookings()
            ->active()
            ->whereDate('return_date', '>=', today())
            ->orderBy('pickup_date')
            ->get(['pickup_date', 'return_date']);
    }

    /**
     * Data for the price slider: the cheapest and dearest daily price in the fleet,
     * and how many cars fall into each of 12 equal price bands (the little bar chart).
     *
     * @return array{min: int, max: int, histogram: list<int>}
     */
    private function priceStats(): array
    {
        $prices = Vehicle::where('status', '!=', 'inactive')
            ->pluck('price_per_day')
            ->map(fn ($price) => (float) $price);

        if ($prices->isEmpty()) {
            return ['min' => 0, 'max' => 0, 'histogram' => []];
        }

        // Round outwards to tens so the slider shows tidy numbers (RM 90 - RM 750).
        $min = (int) (floor($prices->min() / 10) * 10);
        $max = (int) (ceil($prices->max() / 10) * 10);
        $buckets = 12;
        $bucketWidth = max(($max - $min) / $buckets, 1);

        $histogram = array_fill(0, $buckets, 0);
        foreach ($prices as $price) {
            $histogram[min((int) (($price - $min) / $bucketWidth), $buckets - 1)]++;
        }

        return ['min' => $min, 'max' => $max, 'histogram' => $histogram];
    }

    /**
     * One car with its booking form. The dates already taken are listed so the
     * customer can see at a glance which days are free.
     */
    public function show(Request $request, Vehicle $vehicle): Response
    {
        // Retired cars are hidden from customers completely.
        abort_if($vehicle->status === 'inactive', 404);

        $vehicle->load('category:id,name');

        return Inertia::render('cars/show', [
            'vehicle' => [
                'id' => $vehicle->id,
                'name' => $vehicle->full_name,
                'year' => $vehicle->year,
                'category' => $vehicle->category->name,
                'color' => $vehicle->color,
                'transmission' => $vehicle->transmission,
                'fuel_type' => $vehicle->fuel_type,
                'seats' => $vehicle->seats,
                'price_per_day' => (float) $vehicle->price_per_day,
                'description' => $vehicle->description,
                'image_url' => $vehicle->image_url,
                'is_rentable' => $vehicle->status === 'available',
            ],
            'bookedRanges' => $this->upcomingBookings($vehicle)
                ->map(fn (Booking $booking) => $booking->pickup_date->format('d M').' – '.$booking->return_date->format('d M Y')),
            // The same bookings as plain dates, so the calendar can grey those days out.
            'bookedDates' => $this->upcomingBookings($vehicle)
                ->map(fn (Booking $booking) => [
                    'from' => $booking->pickup_date->toDateString(),
                    'to' => $booking->return_date->toDateString(),
                ]),
            // Dates chosen on the browse page are carried over to the booking form.
            'initialDates' => [
                'pickup_date' => (string) $request->query('pickup_date', ''),
                'return_date' => (string) $request->query('return_date', ''),
            ],
            'pickupLocations' => Booking::PICKUP_LOCATIONS,
            'pickupTimes' => Booking::PICKUP_TIMES,
            'nowTime' => now()->format('H:i'), // greys out today's slots that have passed
            'paymentMethods' => Payment::METHODS,
            'profileComplete' => $request->user()->hasCompleteProfile(),
            'today' => today()->toDateString(),
            'maxDays' => Booking::MAX_DAYS,
        ]);
    }
}
