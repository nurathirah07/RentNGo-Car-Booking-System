<?php

use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('the heart saves a car and a second click removes it', function () {
    $customer = User::factory()->create();
    $vehicle = Vehicle::factory()->create();

    $this->actingAs($customer)->post(route('cars.favourite', $vehicle))->assertRedirect();
    expect($customer->favourites()->pluck('vehicles.id')->all())->toBe([$vehicle->id]);

    $this->actingAs($customer)->post(route('cars.favourite', $vehicle));
    expect($customer->favourites()->count())->toBe(0);
});

test('saved cars are listed on the saved page and shared with every page', function () {
    $customer = User::factory()->create();
    [$saved, $notSaved] = Vehicle::factory()->count(2)->create();
    $customer->favourites()->attach($saved);

    $this->actingAs($customer)->get(route('cars.saved'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/saved')
            ->has('vehicles', 1)
            ->where('vehicles.0.id', $saved->id)
            ->where('savedCarIds', [$saved->id]));
});

test('a customer can review a completed trip once', function () {
    $booking = Booking::factory()->completed()->create();

    $this->actingAs($booking->user)
        ->post(route('bookings.review', $booking), ['rating' => 5, 'comment' => 'Spotless car.'])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect(Review::sole())
        ->rating->toBe(5)
        ->vehicle_id->toBe($booking->vehicle_id);

    $this->actingAs($booking->user)
        ->post(route('bookings.review', $booking), ['rating' => 4])
        ->assertForbidden();
});

test('a trip that is not completed cannot be reviewed', function () {
    $booking = Booking::factory()->confirmed()->create();

    $this->actingAs($booking->user)
        ->post(route('bookings.review', $booking), ['rating' => 5])
        ->assertForbidden();
});

test("someone else's booking cannot be reviewed", function () {
    $booking = Booking::factory()->completed()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('bookings.review', $booking), ['rating' => 5])
        ->assertNotFound();
});

test('the rating must be between 1 and 5', function () {
    $booking = Booking::factory()->completed()->create();

    $this->actingAs($booking->user)
        ->post(route('bookings.review', $booking), ['rating' => 6])
        ->assertSessionHasErrors('rating');
});

test('the car page shows the average rating, reviews and gallery', function () {
    $vehicle = Vehicle::factory()->create(['image' => 'vehicles/main.jpg']);
    Review::factory()->for($vehicle)->create(['rating' => 5, 'booking_id' => Booking::factory()->completed()->for($vehicle)]);
    Review::factory()->for($vehicle)->create(['rating' => 4, 'booking_id' => Booking::factory()->completed()->for($vehicle)]);
    VehicleImage::create(['vehicle_id' => $vehicle->id, 'path' => 'vehicles/gallery/side.jpg']);

    $this->actingAs(User::factory()->create())->get(route('cars.show', $vehicle))
        ->assertInertia(fn (Assert $page) => $page
            ->where('vehicle.rating', 4.5)
            ->where('vehicle.reviews_count', 2)
            ->has('vehicle.gallery', 2)
            ->has('reviews', 2));
});

test('admins can add gallery photos and remove them', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();
    $vehicle = Vehicle::factory()->create();
    $old = VehicleImage::create(['vehicle_id' => $vehicle->id, 'path' => UploadedFile::fake()->create('old.jpg', 50, 'image/jpeg')->store('vehicles/gallery', 'public')]);

    $this->actingAs($admin)->put(route('admin.vehicles.update', $vehicle), [
        ...$vehicle->only(['category_id', 'brand', 'model', 'year', 'plate_number', 'transmission', 'fuel_type', 'seats', 'price_per_day', 'status']),
        'gallery' => [
            UploadedFile::fake()->create('front.jpg', 50, 'image/jpeg'),
            UploadedFile::fake()->create('inside.png', 50, 'image/png'),
        ],
        'remove_gallery' => [$old->id],
    ])->assertSessionHasNoErrors();

    $this->assertModelMissing($old);
    Storage::disk('public')->assertMissing($old->path);
    expect($vehicle->images()->count())->toBe(2);
    $vehicle->images->each(fn (VehicleImage $image) => Storage::disk('public')->assertExists($image->path));
});

test('the gallery is limited to six photos', function () {
    $vehicle = Vehicle::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.vehicles.update', $vehicle), [
            ...$vehicle->only(['category_id', 'brand', 'model', 'year', 'plate_number', 'transmission', 'fuel_type', 'seats', 'price_per_day', 'status']),
            'gallery' => array_map(fn (int $i) => UploadedFile::fake()->create("car{$i}.jpg", 10, 'image/jpeg'), range(1, 7)),
        ])
        ->assertSessionHasErrors('gallery');
});
