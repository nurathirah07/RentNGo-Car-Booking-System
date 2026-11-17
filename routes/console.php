<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Every hour: cancel bookings nobody confirmed in time, and close finished trips.
Schedule::command('bookings:tidy')->hourly()->withoutOverlapping();
