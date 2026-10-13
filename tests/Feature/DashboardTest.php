<?php

use App\Models\Booking;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('the dashboard shows how many days until the next pickup', function () {
    $customer = User::factory()->create();
    Booking::factory()->for($customer)->confirmed()
        ->between(today()->addDays(3)->toDateString(), today()->addDays(5)->toDateString())
        ->create();

    $this->actingAs($customer)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('upcomingBookings.0.starts_in_days', 3)
            ->where('upcomingBookings.0.total_days', 3));
});
