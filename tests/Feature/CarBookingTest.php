<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

/** A date $days from today, e.g. inDays(3) = "2026-10-14". */
function inDays(int $days): string
{
    return today()->addDays($days)->toDateString();
}

/**
 * A valid booking form for $vehicle. Tests override only what they care about.
 *
 * @return array<string, mixed>
 */
function bookingData(Vehicle $vehicle, array $overrides = []): array
{
    return [
        'vehicle_id' => $vehicle->id,
        'pickup_date' => inDays(5),
        'return_date' => inDays(7),
        'pickup_time' => '10:00',
        'pickup_location' => 'KL Sentral',
        'payment_method' => 'Online Banking',
        'notes' => 'Arriving by train',
        ...$overrides,
    ];
}

test('browsing with dates only lists cars free for the whole period', function () {
    $free = Vehicle::factory()->create(['model' => 'Free']);
    $booked = Vehicle::factory()->create(['model' => 'Booked']);
    Vehicle::factory()->create(['model' => 'Workshop', 'status' => 'maintenance']);
    Booking::factory()->for($booked)->confirmed()->between(inDays(6), inDays(8))->create();

    $this->actingAs(User::factory()->create())
        ->get(route('cars.index', ['pickup_date' => inDays(5), 'return_date' => inDays(7)]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/index')
            ->has('vehicles.data', 1)
            ->where('vehicles.data.0.id', $free->id));
});

test('the browse filters narrow the car list', function (array $query, array $expectedModels) {
    $compact = Category::factory()->create();
    $mpv = Category::factory()->create();
    Vehicle::factory()->for($compact)->create(['brand' => 'Perodua', 'model' => 'Myvi', 'transmission' => 'Auto', 'seats' => 5, 'price_per_day' => 120]);
    Vehicle::factory()->for($compact)->create(['brand' => 'Proton', 'model' => 'Saga', 'transmission' => 'Manual', 'seats' => 5, 'price_per_day' => 100]);
    Vehicle::factory()->for($mpv)->create(['brand' => 'Toyota', 'model' => 'Innova', 'transmission' => 'Auto', 'seats' => 8, 'price_per_day' => 280]);
    Vehicle::factory()->for($mpv)->create(['brand' => 'Perodua', 'model' => 'Alza', 'transmission' => 'Auto', 'seats' => 7, 'price_per_day' => 200, 'status' => 'maintenance']);

    // Category IDs are only known at runtime, so the dataset uses names.
    $query = collect($query)->map(fn ($value) => match ($value) {
        'compact' => (string) $compact->id,
        'compact,mpv' => "{$compact->id},{$mpv->id}",
        default => $value,
    })->all();

    $this->actingAs(User::factory()->create())
        ->get(route('cars.index', $query))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('vehicles.data', fn ($cars) => collect($cars)->pluck('name')->map(fn ($name) => explode(' ', $name)[1])->all() === $expectedModels));
})->with([
    'search by brand' => [['search' => 'perodua', 'sort' => 'price_asc'], ['Myvi']],
    'one category' => [['category' => 'compact', 'sort' => 'price_asc'], ['Saga', 'Myvi']],
    'several categories' => [['category' => 'compact,mpv', 'sort' => 'price_asc'], ['Saga', 'Myvi', 'Innova']],
    'manual only' => [['transmission' => 'Manual'], ['Saga']],
    'at least 7 seats' => [['seats' => 7], ['Innova']],
    'price range' => [['min_price' => 110, 'max_price' => 250], ['Myvi']],
    'highest price first' => [['sort' => 'price_desc'], ['Innova', 'Myvi', 'Saga']],
    'include cars in maintenance' => [['include_unavailable' => '1', 'sort' => 'price_asc'], ['Saga', 'Myvi', 'Alza', 'Innova']],
]);

test('the browse page sends price statistics for the slider', function () {
    Vehicle::factory()->create(['price_per_day' => 95]);
    Vehicle::factory()->create(['price_per_day' => 744]);
    Vehicle::factory()->create(['price_per_day' => 999, 'status' => 'inactive']);

    $this->actingAs(User::factory()->create())
        ->get(route('cars.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('priceStats.min', 90)
            ->where('priceStats.max', 750)
            ->where('priceStats.histogram', [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]));
});

test('a cancelled booking does not block the car', function () {
    $vehicle = Vehicle::factory()->create();
    Booking::factory()->for($vehicle)->cancelled()->between(inDays(5), inDays(7))->create();

    $this->actingAs(User::factory()->create())
        ->getJson(route('cars.availability', ['vehicle' => $vehicle, 'pickup_date' => inDays(5), 'return_date' => inDays(7)]))
        ->assertOk()
        ->assertJson(['available' => true]);
});

test('the availability check reports the price for free dates', function () {
    $vehicle = Vehicle::factory()->create(['price_per_day' => 120]);

    $this->actingAs(User::factory()->create())
        ->getJson(route('cars.availability', ['vehicle' => $vehicle, 'pickup_date' => inDays(5), 'return_date' => inDays(7)]))
        ->assertOk()
        ->assertExactJson([
            'available' => true,
            'total_days' => 3,
            'total_amount' => 360,
            'message' => 'This car is available for your dates.',
        ]);
});

test('the availability check reports overlapping dates as booked', function (string $pickup, string $return) {
    $vehicle = Vehicle::factory()->create();
    Booking::factory()->for($vehicle)->between(inDays(5), inDays(7))->create();

    $this->actingAs(User::factory()->create())
        ->getJson(route('cars.availability', ['vehicle' => $vehicle, 'pickup_date' => $pickup, 'return_date' => $return]))
        ->assertOk()
        ->assertJson(['available' => false]);
})->with([
    'same dates' => fn () => [inDays(5), inDays(7)],
    'starts on the return day' => fn () => [inDays(7), inDays(9)],
    'ends on the pickup day' => fn () => [inDays(3), inDays(5)],
    'inside the booking' => fn () => [inDays(6), inDays(6)],
    'around the booking' => fn () => [inDays(4), inDays(8)],
]);

test('the availability check validates the dates', function (array $query, string $field) {
    $vehicle = Vehicle::factory()->create();

    $this->actingAs(User::factory()->create())
        ->getJson(route('cars.availability', ['vehicle' => $vehicle, ...$query]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'pickup in the past' => fn () => [['pickup_date' => inDays(-1), 'return_date' => inDays(2)], 'pickup_date'],
    'return before pickup' => fn () => [['pickup_date' => inDays(5), 'return_date' => inDays(4)], 'return_date'],
    'longer than 30 days' => fn () => [['pickup_date' => inDays(1), 'return_date' => inDays(31)], 'return_date'],
]);

test('a customer can book a free car', function () {
    $customer = User::factory()->withRentalDetails()->create();
    $vehicle = Vehicle::factory()->create(['price_per_day' => 150]);

    $this->actingAs($customer)
        ->post(route('bookings.store'), bookingData($vehicle))
        ->assertRedirect(route('bookings.index'))
        ->assertInertiaFlash('toast.type', 'success');

    $booking = Booking::sole();
    expect($booking->user_id)->toBe($customer->id)
        ->and($booking->status)->toBe('pending')
        ->and($booking->total_days)->toBe(3)
        ->and($booking->total_amount)->toBe('450.00')
        ->and($booking->pickup_location)->toBe('KL Sentral')
        ->and($booking->pickupTimeLabel())->toBe('10:00');

    $payment = Payment::sole();
    expect($payment->booking_id)->toBe($booking->id)
        ->and($payment->amount)->toBe('450.00')
        ->and($payment->method)->toBe('Online Banking')
        ->and($payment->status)->toBe('pending');
});

test('a car cannot be double booked', function () {
    $vehicle = Vehicle::factory()->create();
    Booking::factory()->for($vehicle)->confirmed()->between(inDays(6), inDays(9))->create();

    $this->actingAs(User::factory()->withRentalDetails()->create())
        ->post(route('bookings.store'), bookingData($vehicle))
        ->assertSessionHasErrors(['pickup_date' => 'Sorry, this car has just been booked for some of these dates. Please choose different dates.']);

    expect(Booking::count())->toBe(1)
        ->and(Payment::count())->toBe(0);
});

test('a car under maintenance cannot be booked', function () {
    $vehicle = Vehicle::factory()->create(['status' => 'maintenance']);

    $this->actingAs(User::factory()->withRentalDetails()->create())
        ->post(route('bookings.store'), bookingData($vehicle))
        ->assertSessionHasErrors('pickup_date');

    expect(Booking::count())->toBe(0);
});

test('customers must complete their profile before booking', function () {
    $vehicle = Vehicle::factory()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('bookings.store'), bookingData($vehicle))
        ->assertSessionHasErrors('profile');

    expect(Booking::count())->toBe(0);
});

test('booking fields are validated', function (array $overrides, string $field) {
    $vehicle = Vehicle::factory()->create();

    $this->actingAs(User::factory()->withRentalDetails()->create())
        ->post(route('bookings.store'), bookingData($vehicle, $overrides))
        ->assertSessionHasErrors($field);
})->with([
    'unknown pickup location' => [['pickup_location' => 'Penang'], 'pickup_location'],
    'unknown payment method' => [['payment_method' => 'Bitcoin'], 'payment_method'],
    'pickup time outside opening hours' => [['pickup_time' => '22:00'], 'pickup_time'],
    'missing pickup time' => [['pickup_time' => ''], 'pickup_time'],
    'pickup in the past' => fn () => [['pickup_date' => inDays(-1)], 'pickup_date'],
]);

test('a pickup time that has already passed today is rejected', function () {
    $this->travelTo(today()->setTime(14, 30));
    $vehicle = Vehicle::factory()->create();

    $this->actingAs(User::factory()->withRentalDetails()->create())
        ->post(route('bookings.store'), bookingData($vehicle, [
            'pickup_date' => inDays(0),
            'return_date' => inDays(1),
            'pickup_time' => '14:00',
        ]))
        ->assertSessionHasErrors(['pickup_time' => 'That pickup time has already passed today. Please choose a later time.']);

    expect(Booking::count())->toBe(0);
});

test('the car page sends booked dates for the calendar', function () {
    $vehicle = Vehicle::factory()->create();
    Booking::factory()->for($vehicle)->confirmed()->between(inDays(5), inDays(7))->create();
    Booking::factory()->for($vehicle)->cancelled()->between(inDays(10), inDays(11))->create();

    $this->actingAs(User::factory()->create())
        ->get(route('cars.show', $vehicle))
        ->assertInertia(fn (Assert $page) => $page
            ->component('cars/show')
            ->where('bookedDates', [['from' => inDays(5), 'to' => inDays(7)]])
            ->where('pickupTimes', Booking::PICKUP_TIMES));
});

test('customers can cancel their own upcoming booking and a payment is refunded', function () {
    $customer = User::factory()->create();
    $booking = Booking::factory()->for($customer)->confirmed()->between(inDays(5), inDays(7))->create();
    $payment = Payment::factory()->for($booking)->paid()->create();

    $this->actingAs($customer)
        ->patch(route('bookings.cancel', $booking))
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect($booking->refresh()->status)->toBe('cancelled')
        ->and($payment->refresh()->status)->toBe('refunded');
});

test('customers cannot cancel on or after the pickup day', function () {
    $customer = User::factory()->create();
    $booking = Booking::factory()->for($customer)->confirmed()->between(inDays(0), inDays(2))->create();

    $this->actingAs($customer)
        ->patch(route('bookings.cancel', $booking))
        ->assertInertiaFlash('toast.type', 'error');

    expect($booking->refresh()->status)->toBe('confirmed');
});

test('customers cannot cancel another customer\'s booking', function () {
    $booking = Booking::factory()->between(inDays(5), inDays(7))->create();

    $this->actingAs(User::factory()->create())
        ->patch(route('bookings.cancel', $booking))
        ->assertNotFound();

    expect($booking->refresh()->status)->toBe('pending');
});

test('my bookings only shows the customer\'s own bookings', function () {
    $customer = User::factory()->create();
    $own = Booking::factory()->for($customer)->create();
    Booking::factory()->create();

    $this->actingAs($customer)
        ->get(route('bookings.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('bookings/index')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.id', $own->id));
});
