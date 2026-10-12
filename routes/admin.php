<?php

use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\VehicleController;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Support\Facades\Route;

/*
| Admin routes
| Every route in this group:
|   - starts with /admin           (prefix)
|   - has a name starting "admin." (name)
|   - needs a logged-in admin      (auth + EnsureUserIsAdmin middleware)
*/
Route::middleware(['auth', EnsureUserIsAdmin::class])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', DashboardController::class)->name('dashboard');

        // One line registers 6 routes: index, create, store, edit, update, destroy
        // (named admin.vehicles.index, admin.vehicles.store, ...).
        // "show" is skipped because the admin edits a vehicle instead of viewing it alone.
        Route::resource('vehicles', VehicleController::class)->except('show');

        Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
        Route::patch('bookings/{booking}/status', [BookingController::class, 'updateStatus'])->name('bookings.status');
        Route::patch('bookings/{booking}/payment', [BookingController::class, 'markPaid'])->name('bookings.payment');

        Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::patch('customers/{user}/status', [CustomerController::class, 'updateStatus'])->name('customers.status');
    });
