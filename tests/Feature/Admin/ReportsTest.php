<?php

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

test('the reports page totals paid revenue per month and ranks cars', function () {
    $popular = Vehicle::factory()->create();
    Booking::factory()->count(2)->for($popular)->create();
    Booking::factory()->cancelled()->for(Vehicle::factory()->create())->create();
    Payment::factory()->paid()->create(['amount' => 300, 'paid_at' => now()]);
    Payment::factory()->paid()->create(['amount' => 200, 'paid_at' => now()]);
    Payment::factory()->create(['amount' => 999]); // pending: not revenue

    $this->actingAs(User::factory()->admin()->create())->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/reports')
            ->has('monthlyRevenue', 12)
            ->where('monthlyRevenue.11.revenue', 500)
            ->where('topCars.0.id', $popular->id)
            ->where('topCars.0.bookings', 2)
            ->where('summary.revenueThisMonth', 500));
});

test('utilisation counts only the rented days inside the last 30 days', function () {
    $vehicle = Vehicle::factory()->create();
    // 3 days inside the window (the days before it don't count).
    Booking::factory()->completed()->for($vehicle)
        ->between(today()->subDays(32)->toDateString(), today()->subDays(27)->toDateString())
        ->create();

    $this->actingAs(User::factory()->admin()->create())->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('utilisation.bookedDays', 3)
            ->where('utilisation.availableDays', 30)
            ->where('utilisation.percent', 10));
});

test('admins can export every booking as CSV', function () {
    $booking = Booking::factory()->create();

    $response = $this->actingAs(User::factory()->admin()->create())->get(route('admin.reports.export'));

    $response->assertOk()->assertDownload();
    expect($response->streamedContent())
        ->toContain('Reference,Customer')
        ->toContain($booking->booking_ref);
});

test('the fleet calendar places each booking in its day columns', function () {
    $vehicle = Vehicle::factory()->create();
    Booking::factory()->confirmed()->for($vehicle)
        ->between(today()->addDays(1)->toDateString(), today()->addDays(3)->toDateString())
        ->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.calendar', ['start' => today()->toDateString()]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/calendar')
            ->has('days', 14)
            ->where('vehicles.0.bookings.0.offset', 1)
            ->where('vehicles.0.bookings.0.span', 3));
});

test('the activity log can be filtered by area', function () {
    ActivityLog::record('booking.created', 'Aisyah booked RNG-1.');
    ActivityLog::record('vehicle.updated', 'Admin updated a car.');

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.activity', ['area' => 'vehicle']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/activity')
            ->has('logs.data', 1)
            ->where('logs.data.0.action', 'vehicle.updated'));
});

test('customers cannot open the admin reports', function (string $route) {
    $this->actingAs(User::factory()->create())->get(route($route))->assertForbidden();
})->with(['admin.reports.index', 'admin.reports.export', 'admin.calendar', 'admin.activity']);
