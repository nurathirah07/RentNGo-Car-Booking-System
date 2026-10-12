<?php

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

test('customers cannot access booking management', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('admin.bookings.index'))
        ->assertForbidden();
});

test('admins can search bookings by customer and filter by status', function () {
    $aisyah = User::factory()->create(['name' => 'Aisyah Rahman']);
    $match = Booking::factory()->for($aisyah)->confirmed()->create();
    Booking::factory()->for($aisyah)->cancelled()->create();
    Booking::factory()->confirmed()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.bookings.index', ['search' => 'aisyah', 'status' => 'confirmed']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/bookings/index')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.id', $match->id)
            ->where('bookings.data.0.next_statuses', ['completed', 'cancelled']));
});

test('admins can confirm a pending booking', function () {
    $booking = Booking::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.bookings.status', $booking), ['status' => 'confirmed'])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect($booking->refresh()->status)->toBe('confirmed');
});

test('admins cannot make a status change that is not allowed', function (string $state, string $newStatus) {
    $booking = Booking::factory()->create(['status' => $state]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.bookings.status', $booking), ['status' => $newStatus])
        ->assertInertiaFlash('toast.type', 'error');

    expect($booking->refresh()->status)->toBe($state);
})->with([
    'reopen a cancelled booking' => ['cancelled', 'confirmed'],
    'undo a completed booking' => ['completed', 'pending'],
    'move a confirmed booking back to pending' => ['confirmed', 'pending'],
    'complete without confirming' => ['pending', 'completed'],
]);

test('a booking cannot be completed before its pickup date', function () {
    $booking = Booking::factory()->confirmed()->between(today()->addDays(3)->toDateString(), today()->addDays(4)->toDateString())->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.bookings.status', $booking), ['status' => 'completed'])
        ->assertInertiaFlash('toast.message', 'A booking cannot be completed before its pickup date.');

    expect($booking->refresh()->status)->toBe('confirmed');
});

test('cancelling a paid booking marks the payment refunded and frees the car', function () {
    $vehicle = Vehicle::factory()->create();
    $pickup = today()->addDays(3)->toDateString();
    $return = today()->addDays(4)->toDateString();
    $booking = Booking::factory()->for($vehicle)->confirmed()->between($pickup, $return)->create();
    $payment = Payment::factory()->for($booking)->paid()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.bookings.status', $booking), ['status' => 'cancelled']);

    expect($booking->refresh()->status)->toBe('cancelled')
        ->and($payment->refresh()->status)->toBe('refunded')
        ->and($vehicle->isAvailableBetween($pickup, $return))->toBeTrue();
});

test('admins can record a pending payment as paid', function () {
    $payment = Payment::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.bookings.payment', $payment->booking))
        ->assertInertiaFlash('toast.type', 'success');

    $payment->refresh();
    expect($payment->status)->toBe('paid')
        ->and($payment->paid_at)->not->toBeNull()
        ->and($payment->transaction_ref)->toStartWith('ADM');
});

test('a cancelled booking cannot be marked as paid', function () {
    $booking = Booking::factory()->cancelled()->create();
    $payment = Payment::factory()->for($booking)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.bookings.payment', $booking))
        ->assertInertiaFlash('toast.type', 'error');

    expect($payment->refresh()->status)->toBe('pending');
});
