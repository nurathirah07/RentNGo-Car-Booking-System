<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVehicleRequest;
use App\Http\Requests\Admin\UpdateVehicleRequest;
use App\Models\Category;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin CRUD for the car fleet.
 * Routes: admin.vehicles.index / create / store / edit / update / destroy (see routes/admin.php).
 */
class VehicleController extends Controller
{
    /**
     * List vehicles with search, filters and pagination.
     * The filters come from the query string (?search=myvi&category=2&status=available),
     * so a filtered page can be bookmarked or refreshed without losing the filters.
     */
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'category' => (string) $request->query('category', ''),
            'status' => (string) $request->query('status', ''),
        ];

        $vehicles = Vehicle::query()
            ->with('category:id,name') // eager load to avoid an N+1 query per row
            // when() only adds the condition if the filter has a value.
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $term = '%'.$filters['search'].'%';

                // Wrapped in a closure so the ORs are grouped in brackets:
                // ... AND (brand LIKE ? OR model LIKE ? OR plate_number LIKE ?)
                $query->where(function (Builder $query) use ($term) {
                    $query->where('brand', 'like', $term)
                        ->orWhere('model', 'like', $term)
                        ->orWhere('plate_number', 'like', $term);
                });
            })
            ->when($filters['category'] !== '', fn (Builder $query) => $query->where('category_id', $filters['category']))
            ->when(in_array($filters['status'], Vehicle::STATUSES, true), fn (Builder $query) => $query->where('status', $filters['status']))
            ->latest('id')
            ->paginate(15)
            ->withQueryString() // keep ?search=...&status=... on the page 2, 3... links
            ->through(fn (Vehicle $vehicle) => [
                'id' => $vehicle->id,
                'brand' => $vehicle->brand,
                'model' => $vehicle->model,
                'year' => $vehicle->year,
                'plate_number' => $vehicle->plate_number,
                'category' => $vehicle->category->name,
                'price_per_day' => (float) $vehicle->price_per_day,
                'status' => $vehicle->status,
                'image_url' => $vehicle->image_url,
            ]);

        return Inertia::render('admin/vehicles/index', [
            'vehicles' => $vehicles,
            'filters' => $filters,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'statuses' => Vehicle::STATUSES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/vehicles/create', $this->formOptions());
    }

    public function store(StoreVehicleRequest $request): RedirectResponse
    {
        // safe() only contains fields that passed the rules, so extra
        // fields sent by a user can never reach the database.
        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            // Saves to storage/app/public/vehicles/<random-name>.jpg and returns that path.
            $data['image'] = $request->file('image')->store('vehicles', 'public');
        }

        $vehicle = Vehicle::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$vehicle->full_name} was added."]);

        return to_route('admin.vehicles.index');
    }

    /**
     * Route model binding: Laravel finds the Vehicle from the {vehicle} id in the URL (404 if missing).
     */
    public function edit(Vehicle $vehicle): Response
    {
        return Inertia::render('admin/vehicles/edit', [
            ...$this->formOptions(),
            'vehicle' => [
                'id' => $vehicle->id,
                'category_id' => $vehicle->category_id,
                'brand' => $vehicle->brand,
                'model' => $vehicle->model,
                'year' => $vehicle->year,
                'plate_number' => $vehicle->plate_number,
                'color' => $vehicle->color,
                'transmission' => $vehicle->transmission,
                'fuel_type' => $vehicle->fuel_type,
                'seats' => $vehicle->seats,
                'price_per_day' => (float) $vehicle->price_per_day,
                'status' => $vehicle->status,
                'description' => $vehicle->description,
                'image_url' => $vehicle->image_url,
            ],
        ]);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $request->safe()->except('image');

        // Only touch the image when a new file was uploaded; otherwise keep the current one.
        if ($request->hasFile('image')) {
            $oldImage = $vehicle->image;
            $data['image'] = $request->file('image')->store('vehicles', 'public');

            // Remove the old file so replaced photos don't pile up on the disk.
            if ($oldImage) {
                Storage::disk('public')->delete($oldImage);
            }
        }

        $vehicle->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$vehicle->full_name} was updated."]);

        return to_route('admin.vehicles.index');
    }

    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        // Bookings point at this vehicle (and the FK is restrictOnDelete), and we need the
        // booking history for records and revenue. So a vehicle that was ever booked
        // is "retired" by setting its status to inactive instead of being deleted.
        if ($vehicle->bookings()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "{$vehicle->full_name} has bookings and cannot be deleted. Set its status to \"inactive\" instead.",
            ]);

            return back();
        }

        $vehicle->delete();

        // Delete the photo only after the database row is gone.
        if ($vehicle->image) {
            Storage::disk('public')->delete($vehicle->image);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$vehicle->full_name} was deleted."]);

        return back();
    }

    /**
     * Dropdown options shared by the create and edit pages.
     *
     * @return array{categories: mixed, transmissions: list<string>, fuelTypes: list<string>, statuses: list<string>}
     */
    private function formOptions(): array
    {
        return [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'transmissions' => Vehicle::TRANSMISSIONS,
            'fuelTypes' => Vehicle::FUEL_TYPES,
            'statuses' => Vehicle::STATUSES,
        ];
    }
}
