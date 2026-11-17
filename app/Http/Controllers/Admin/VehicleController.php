<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVehicleRequest;
use App\Http\Requests\Admin\UpdateVehicleRequest;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Vehicle;
use App\Models\VehicleImage;
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
        $data = $request->safe()->except(['image', 'gallery', 'remove_gallery']);

        if ($request->hasFile('image')) {
            // Saves to storage/app/public/vehicles/<random-name>.jpg and returns that path.
            $data['image'] = $request->file('image')->store('vehicles', 'public');
        }

        $vehicle = Vehicle::create($data);
        $this->syncGallery($request, $vehicle);

        ActivityLog::record('vehicle.created', "{$request->user()->name} added {$vehicle->full_name} ({$vehicle->plate_number}).", $vehicle);
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$vehicle->full_name} was added."]);

        return to_route('admin.vehicles.index');
    }

    /**
     * Route model binding: Laravel finds the Vehicle from the {vehicle} id in the URL (404 if missing).
     */
    public function edit(Vehicle $vehicle): Response
    {
        $vehicle->load('images');

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
                'gallery' => $vehicle->images->map(fn (VehicleImage $image) => [
                    'id' => $image->id,
                    'url' => $image->url,
                ]),
            ],
        ]);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $request->safe()->except(['image', 'gallery', 'remove_gallery']);

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
        $this->syncGallery($request, $vehicle);

        ActivityLog::record('vehicle.updated', "{$request->user()->name} updated {$vehicle->full_name} ({$vehicle->plate_number}).", $vehicle);
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

        // Remember the files first: the gallery rows are removed with the car (cascade).
        $files = $vehicle->images()->pluck('path')->push($vehicle->image)->filter()->all();

        $vehicle->delete();

        // Delete the photos only after the database row is gone.
        Storage::disk('public')->delete($files);

        ActivityLog::record('vehicle.deleted', auth()->user()?->name." deleted {$vehicle->full_name} ({$vehicle->plate_number}).");
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$vehicle->full_name} was deleted."]);

        return back();
    }

    /**
     * Remove the gallery photos the admin ticked, then add the newly uploaded ones,
     * never going over Vehicle::MAX_GALLERY_IMAGES in total.
     */
    private function syncGallery(StoreVehicleRequest $request, Vehicle $vehicle): void
    {
        $removed = $vehicle->images()->whereKey($request->validated('remove_gallery', []))->get();

        foreach ($removed as $image) {
            $image->delete();
            Storage::disk('public')->delete($image->path);
        }

        $room = Vehicle::MAX_GALLERY_IMAGES - $vehicle->images()->count();
        $position = (int) $vehicle->images()->max('position');

        foreach (array_slice($request->file('gallery', []), 0, max($room, 0)) as $file) {
            $vehicle->images()->create([
                'path' => $file->store('vehicles/gallery', 'public'),
                'position' => ++$position,
            ]);
        }
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
