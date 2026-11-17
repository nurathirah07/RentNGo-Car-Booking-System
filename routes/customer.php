<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\FavouriteController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\VehicleAvailabilityController;
use App\Http\Middleware\EnsureUserIsCustomer;
use Illuminate\Support\Facades\Route;

/*
| Customer routes: browse cars and manage your own bookings.
| Needs a logged-in, verified CUSTOMER (admins get 403 from EnsureUserIsCustomer).
*/
Route::middleware(['auth', 'verified', EnsureUserIsCustomer::class])->group(function () {
    Route::get('cars', [CarController::class, 'index'])->name('cars.index');
    Route::get('cars/saved', [FavouriteController::class, 'index'])->name('cars.saved');
    Route::get('cars/{vehicle}', [CarController::class, 'show'])->name('cars.show');
    Route::post('cars/{vehicle}/favourite', [FavouriteController::class, 'toggle'])->name('cars.favourite');

    // JSON endpoint for the live availability check on the booking form.
    // throttle: at most 60 checks per minute per user, so it can't be used to hammer the database.
    Route::get('cars/{vehicle}/availability', VehicleAvailabilityController::class)
        ->middleware('throttle:60,1')
        ->name('cars.availability');

    Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::post('bookings', [BookingController::class, 'store'])
        ->middleware('throttle:10,1') // stops a script from spamming bookings
        ->name('bookings.store');
    Route::patch('bookings/{booking}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');
    Route::post('bookings/{booking}/pay', [PaymentController::class, 'start'])
        ->middleware('throttle:10,1')
        ->name('bookings.pay');
    Route::get('payments/toyyibpay/return', [PaymentController::class, 'return'])->name('payments.toyyibpay.return');
    Route::get('bookings/{booking}/receipt', ReceiptController::class)->name('bookings.receipt');
    Route::post('bookings/{booking}/review', [ReviewController::class, 'store'])->name('bookings.review');
});

// ToyyibPay's server-to-server payment notice: no login (it comes from ToyyibPay, not the customer).
Route::post('payments/toyyibpay/callback', [PaymentController::class, 'callback'])
    ->middleware('throttle:60,1')
    ->name('payments.toyyibpay.callback');
