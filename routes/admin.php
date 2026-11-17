<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FleetCalendarController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\VehicleController;
use App\Http\Controllers\ReceiptController;
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
        Route::get('bookings/{booking}/receipt', ReceiptController::class)->name('bookings.receipt');

        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/bookings.csv', [ReportController::class, 'export'])->name('reports.export');
        Route::get('calendar', FleetCalendarController::class)->name('calendar');
        Route::get('activity', ActivityLogController::class)->name('activity');

        Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::patch('customers/{user}/status', [CustomerController::class, 'updateStatus'])->name('customers.status');
    });
