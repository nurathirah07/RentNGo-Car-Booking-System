<?php

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use App\Notifications\BookingReceived;
use App\Notifications\BookingStatusChanged;
use App\Notifications\NewBookingForAdmin;
use App\Notifications\PaymentReceived;
use Illuminate\Support\Facades\Notification;

test('booking a car notifies the customer and every admin, and is logged', function () {
    Notification::fake();
    $admins = User::factory()->admin()->count(2)->create();
    $customer = User::factory()->withRentalDetails()->create();
    $vehicle = Vehicle::factory()->create();

    $this->actingAs($customer)->post(route('bookings.store'), [
        'vehicle_id' => $vehicle->id,
        'pickup_date' => today()->addDays(3)->toDateString(),
        'return_date' => today()->addDays(4)->toDateString(),
        'pickup_time' => '10:00',
        'pickup_location' => 'KL Sentral',
        'payment_method' => 'Cash',
    ])->assertRedirect(route('bookings.index'));

    Notification::assertSentTo($customer, BookingReceived::class);
    Notification::assertSentTo($admins, NewBookingForAdmin::class);
    expect(ActivityLog::where('action', 'booking.created')->count())->toBe(1);
});

test('confirming a booking notifies the customer and logs who did it', function () {
    Notification::fake();
    $admin = User::factory()->admin()->create(['name' => 'Huda']);
    $booking = Booking::factory()->create();

    $this->actingAs($admin)->patch(route('admin.bookings.status', $booking), ['status' => 'confirmed']);

    Notification::assertSentTo($booking->user, BookingStatusChanged::class);
    expect(ActivityLog::sole())
        ->action->toBe('booking.confirmed')
        ->user_id->toBe($admin->id)
        ->description->toContain('Huda');
});

test('completing a late return charges 1.5x the daily price per late day', function () {
    Notification::fake();
    $booking = Booking::factory()->confirmed()
        ->between(today()->subDays(3)->toDateString(), today()->subDay()->toDateString())
        ->create(['price_per_day' => 100]);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.bookings.status', $booking), ['status' => 'completed', 'late_days' => 2]);

    $booking->refresh();
    expect($booking->status)->toBe('completed')
        ->and($booking->late_days)->toBe(2)
        ->and($booking->late_fee)->toBe('300.00');
});

test('recording a payment emails the customer a receipt notice', function () {
    Notification::fake();
    $payment = Payment::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.bookings.payment', $payment->booking));

    Notification::assertSentTo($payment->booking->user, PaymentReceived::class);
    expect(ActivityLog::where('action', 'payment.recorded')->exists())->toBeTrue();
});

test('the hourly clean-up cancels unconfirmed bookings and completes finished trips', function () {
    Notification::fake();
    $stale = Booking::factory()->between(today()->addDays(5)->toDateString(), today()->addDays(6)->toDateString())
        ->create(['created_at' => now()->subHours(25)]);
    $missedPickup = Booking::factory()->between(today()->subDay()->toDateString(), today()->addDay()->toDateString())->create();
    $fresh = Booking::factory()->between(today()->addDays(5)->toDateString(), today()->addDays(6)->toDateString())->create();
    $finished = Booking::factory()->confirmed()
        ->between(today()->subDays(4)->toDateString(), today()->subDays(2)->toDateString())->create();
    $ongoing = Booking::factory()->confirmed()
        ->between(today()->subDay()->toDateString(), today()->addDay()->toDateString())->create();

    $this->artisan('bookings:tidy')->assertSuccessful();

    expect($stale->refresh()->status)->toBe('cancelled')
        ->and($missedPickup->refresh()->status)->toBe('cancelled')
        ->and($fresh->refresh()->status)->toBe('pending')
        ->and($finished->refresh()->status)->toBe('completed')
        ->and($ongoing->refresh()->status)->toBe('confirmed');
    Notification::assertSentTo($stale->user, BookingStatusChanged::class);
    expect(ActivityLog::whereNull('user_id')->count())->toBe(3); // done by the system
});

test('opening a notification marks it read and goes to its page', function () {
    $customer = User::factory()->create();
    $booking = Booking::factory()->for($customer)->create();
    $customer->notifyNow(new BookingReceived($booking), ['database']);
    $notification = $customer->notifications()->sole();

    $this->actingAs($customer)
        ->get(route('notifications.open', $notification->id))
        ->assertRedirect(route('bookings.index'));

    expect($notification->refresh()->read_at)->not->toBeNull();
});

test('customers cannot open someone else\'s notification', function () {
    $owner = User::factory()->create();
    $owner->notifyNow(new BookingReceived(Booking::factory()->for($owner)->create()), ['database']);

    $this->actingAs(User::factory()->create())
        ->get(route('notifications.open', $owner->notifications()->sole()->id))
        ->assertNotFound();
});

test('mark all as read clears the unread count', function () {
    $customer = User::factory()->create();
    $booking = Booking::factory()->for($customer)->create();
    $customer->notifyNow(new BookingReceived($booking), ['database']);
    $customer->notifyNow(new PaymentReceived($booking), ['database']);

    $this->actingAs($customer)->post(route('notifications.read-all'))->assertRedirect();

    expect($customer->unreadNotifications()->count())->toBe(0);
});
