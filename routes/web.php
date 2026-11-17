<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Admins are sent to the admin dashboard; customers see their own dashboard.
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::get('notifications/{notification}', [NotificationController::class, 'open'])->name('notifications.open');
});

require __DIR__.'/settings.php';
require __DIR__.'/customer.php';
require __DIR__.'/admin.php';
