<?php

use App\Models\Booking;
use App\Models\Category;
use App\Models\Vehicle;
use Inertia\Testing\AssertableInertia as Assert;

test('the landing page shows the most booked available cars first', function () {
    $quiet = Vehicle::factory()->create(['model' => 'Saga', 'price_per_day' => 100]);
    $popular = Vehicle::factory()->create(['model' => 'Myvi', 'price_per_day' => 120]);
    Booking::factory()->count(2)->for($popular)->create();
    Vehicle::factory()->create(['model' => 'Ativa', 'status' => 'maintenance']);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('popularCars', 2)
            ->where('popularCars.0.id', $popular->id)
            ->where('popularCars.0.is_popular', true)
            ->where('popularCars.1.id', $quiet->id));
});

test('the landing page counts available cars per category', function () {
    $sedan = Category::factory()->create(['name' => 'Sedan']);
    Vehicle::factory()->for($sedan)->create(['price_per_day' => 180]);
    Vehicle::factory()->for($sedan)->create(['price_per_day' => 100]);
    Vehicle::factory()->for($sedan)->create(['price_per_day' => 50, 'status' => 'inactive']);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('categories.0.name', 'Sedan')
            ->where('categories.0.cars', 2)
            ->where('categories.0.from_price', 100));
});
