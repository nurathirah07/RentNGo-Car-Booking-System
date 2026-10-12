<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A complete, valid form submission. Tests override only the fields they care about.
 *
 * @return array<string, mixed>
 */
function validVehicleData(array $overrides = []): array
{
    return [
        'category_id' => Category::factory()->create()->id,
        'brand' => 'Perodua',
        'model' => 'Myvi',
        'year' => 2024,
        'plate_number' => 'WXY 1234',
        'color' => 'Red',
        'transmission' => 'Auto',
        'fuel_type' => 'Petrol',
        'seats' => 5,
        'price_per_day' => 120,
        'status' => 'available',
        'description' => 'Compact hatchback.',
        ...$overrides,
    ];
}

test('customers cannot access vehicle management', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)
        ->get(route('admin.vehicles.index'))
        ->assertForbidden();
});

test('admins can search and filter the vehicle list', function () {
    $category = Category::factory()->create();
    Vehicle::factory()->for($category)->create(['model' => 'Myvi', 'status' => 'available']);
    Vehicle::factory()->for($category)->create(['model' => 'Myvi', 'status' => 'maintenance']);
    Vehicle::factory()->create(['model' => 'Saga', 'status' => 'available']);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.vehicles.index', ['search' => 'myvi', 'category' => $category->id, 'status' => 'available']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/vehicles/index')
            ->has('vehicles.data', 1)
            ->where('vehicles.data.0.model', 'Myvi')
            ->where('vehicles.data.0.status', 'available')
            ->where('filters.search', 'myvi'));
});

test('admins can create a vehicle with an image', function () {
    Storage::fake('public');

    $response = $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.vehicles.store'), validVehicleData([
            'plate_number' => 'wxy 1234',
            'image' => UploadedFile::fake()->create('myvi.jpg', 100, 'image/jpeg'),
        ]));

    $response->assertRedirect(route('admin.vehicles.index'))
        ->assertInertiaFlash('toast.type', 'success');

    $vehicle = Vehicle::sole();
    expect($vehicle->plate_number)->toBe('WXY 1234')
        ->and($vehicle->image)->toStartWith('vehicles/');
    Storage::disk('public')->assertExists($vehicle->image);
});

test('admins can update a vehicle and replacing the image deletes the old file', function () {
    Storage::fake('public');
    $oldImage = UploadedFile::fake()->create('old.jpg', 100, 'image/jpeg')->store('vehicles', 'public');
    $vehicle = Vehicle::factory()->create(['plate_number' => 'WXY 1234', 'image' => $oldImage]);

    // Keeping the same plate must pass: the unique rule ignores the vehicle being edited.
    $response = $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.vehicles.update', $vehicle), validVehicleData([
            'price_per_day' => 150,
            'status' => 'maintenance',
            'image' => UploadedFile::fake()->create('new.png', 100, 'image/png'),
        ]));

    $response->assertRedirect(route('admin.vehicles.index'))
        ->assertSessionHasNoErrors();

    $vehicle->refresh();
    expect($vehicle->price_per_day)->toBe('150.00')
        ->and($vehicle->status)->toBe('maintenance')
        ->and($vehicle->image)->not->toBe($oldImage);
    Storage::disk('public')->assertMissing($oldImage);
    Storage::disk('public')->assertExists($vehicle->image);
});

test('admins can delete a vehicle without bookings', function () {
    Storage::fake('public');
    $image = UploadedFile::fake()->create('car.jpg', 100, 'image/jpeg')->store('vehicles', 'public');
    $vehicle = Vehicle::factory()->create(['image' => $image]);

    $this->actingAs(User::factory()->admin()->create())
        ->delete(route('admin.vehicles.destroy', $vehicle))
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    $this->assertModelMissing($vehicle);
    Storage::disk('public')->assertMissing($image);
});

test('the plate number must be unique', function () {
    Vehicle::factory()->create(['plate_number' => 'WXY 1234']);

    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.vehicles.store'), validVehicleData(['plate_number' => 'wxy 1234']))
        ->assertSessionHasErrors(['plate_number' => 'Another vehicle already uses this plate number.']);

    expect(Vehicle::count())->toBe(1);
});

test('a vehicle cannot take the plate number of another vehicle on update', function () {
    Vehicle::factory()->create(['plate_number' => 'WXY 1234']);
    $vehicle = Vehicle::factory()->create(['plate_number' => 'ABC 999']);

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.vehicles.update', $vehicle), validVehicleData(['plate_number' => 'WXY 1234']))
        ->assertSessionHasErrors(['plate_number' => 'Another vehicle already uses this plate number.']);

    expect($vehicle->refresh()->plate_number)->toBe('ABC 999');
});

test('vehicle fields are validated', function (array $overrides, string $field) {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.vehicles.store'), validVehicleData($overrides))
        ->assertSessionHasErrors($field);
})->with([
    'year before 2000' => [['year' => 1999], 'year'],
    'year after next year' => [['year' => (int) date('Y') + 2], 'year'],
    'too few seats' => [['seats' => 1], 'seats'],
    'too many seats' => [['seats' => 16], 'seats'],
    'zero price' => [['price_per_day' => 0], 'price_per_day'],
    'unknown transmission' => [['transmission' => 'CVT'], 'transmission'],
    'unknown fuel type' => [['fuel_type' => 'Gas'], 'fuel_type'],
    'unknown status' => [['status' => 'sold'], 'status'],
    'image is not jpg/png/webp' => fn () => [['image' => UploadedFile::fake()->create('car.gif', 100, 'image/gif')], 'image'],
    'image over 2 MB' => fn () => [['image' => UploadedFile::fake()->create('car.jpg', 2049, 'image/jpeg')], 'image'],
]);

test('a vehicle with bookings cannot be deleted', function () {
    $vehicle = Vehicle::factory()->create();
    Booking::factory()->for($vehicle)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->from(route('admin.vehicles.index'))
        ->delete(route('admin.vehicles.destroy', $vehicle))
        ->assertRedirect(route('admin.vehicles.index'))
        ->assertInertiaFlash('toast.type', 'error')
        ->assertInertiaFlash('toast.message', "{$vehicle->full_name} has bookings and cannot be deleted. Set its status to \"inactive\" instead.");

    $this->assertModelExists($vehicle);
});
