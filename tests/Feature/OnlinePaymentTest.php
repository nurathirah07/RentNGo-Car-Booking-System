<?php

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\PaymentReceived;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    config([
        'services.toyyibpay.secret_key' => 'test-secret',
        'services.toyyibpay.category_code' => 'cat123',
        'services.toyyibpay.sandbox' => true,
    ]);
    Notification::fake();
});

function bookingAwaitingPayment(array $payment = []): Booking
{
    $booking = Booking::factory()->create(['total_amount' => 720]);
    Payment::factory()->for($booking)->create(['amount' => 720, ...$payment]);

    return $booking;
}

test('paying online creates a ToyyibPay bill and sends the customer to it', function () {
    Http::fake(['dev.toyyibpay.com/index.php/api/createBill' => Http::response([['BillCode' => 'abc123']])]);
    $booking = bookingAwaitingPayment();

    $this->actingAs($booking->user)
        ->post(route('bookings.pay', $booking), [], ['X-Inertia' => 'true'])
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://dev.toyyibpay.com/abc123');

    expect($booking->payment->fresh()->gateway_bill_code)->toBe('abc123');
    Http::assertSent(fn (HttpRequest $request) => $request['billAmount'] === 72000
        && $request['billExternalReferenceNo'] === $booking->booking_ref);
});

test('the callback records the payment only after ToyyibPay confirms it', function () {
    Http::fake(['dev.toyyibpay.com/index.php/api/getBillTransactions' => Http::response([
        ['billpaymentStatus' => '1', 'billpaymentAmount' => '720.00', 'billpaymentInvoiceNo' => 'TP-999'],
    ])]);
    $booking = bookingAwaitingPayment(['gateway_bill_code' => 'abc123']);

    $this->post(route('payments.toyyibpay.callback'), ['billcode' => 'abc123', 'status' => '1'])
        ->assertOk();

    expect($booking->payment->fresh())
        ->status->toBe('paid')
        ->transaction_ref->toBe('TP-999');
    Notification::assertSentTo($booking->user, PaymentReceived::class);
});

test('a callback is ignored when ToyyibPay has no matching paid transaction', function () {
    Http::fake(['dev.toyyibpay.com/index.php/api/getBillTransactions' => Http::response([
        ['billpaymentStatus' => '1', 'billpaymentAmount' => '1.00', 'billpaymentInvoiceNo' => 'TP-1'],
    ])]);
    $booking = bookingAwaitingPayment(['gateway_bill_code' => 'abc123']);

    // Someone fakes a "paid" notice, but the gateway only saw RM 1.00.
    $this->post(route('payments.toyyibpay.callback'), ['billcode' => 'abc123', 'status' => '1'])->assertOk();

    expect($booking->payment->fresh()->status)->toBe('pending');
    Notification::assertNothingSent();
});

test('returning from ToyyibPay after paying shows a success message', function () {
    Http::fake(['dev.toyyibpay.com/index.php/api/getBillTransactions' => Http::response([
        ['billpaymentStatus' => '1', 'billpaymentAmount' => '720.00', 'billpaymentInvoiceNo' => 'TP-999'],
    ])]);
    $booking = bookingAwaitingPayment(['gateway_bill_code' => 'abc123']);

    $this->actingAs($booking->user)
        ->get(route('payments.toyyibpay.return', ['billcode' => 'abc123', 'status_id' => 1]))
        ->assertRedirect(route('bookings.index'))
        ->assertInertiaFlash('toast.type', 'success');

    expect($booking->payment->fresh()->status)->toBe('paid');
});

test("customers cannot pay someone else's booking", function () {
    Http::fake();
    $booking = bookingAwaitingPayment();

    $this->actingAs(User::factory()->create())
        ->post(route('bookings.pay', $booking))
        ->assertNotFound();

    Http::assertNothingSent();
});

test('a paid booking cannot be paid again', function () {
    Http::fake();
    $booking = bookingAwaitingPayment(['status' => 'paid']);

    $this->actingAs($booking->user)->post(route('bookings.pay', $booking))->assertForbidden();
});

test('online payment is unavailable until ToyyibPay keys are set', function () {
    config(['services.toyyibpay.secret_key' => null]);
    Http::fake();
    $booking = bookingAwaitingPayment();

    $this->actingAs($booking->user)
        ->post(route('bookings.pay', $booking))
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'error');

    Http::assertNothingSent();
});

test('customers can download their own receipt and admins any receipt', function () {
    $booking = bookingAwaitingPayment();

    $this->actingAs($booking->user)->get(route('bookings.receipt', $booking))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');

    $this->actingAs(User::factory()->admin()->create())->get(route('admin.bookings.receipt', $booking))
        ->assertOk();

    $this->actingAs(User::factory()->create())->get(route('bookings.receipt', $booking))
        ->assertNotFound();
});
