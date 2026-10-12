<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('customers cannot access customer management', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('admin.customers.index'))
        ->assertForbidden();
});

test('admins can search customers and admins are never listed', function () {
    $match = User::factory()->withRentalDetails()->create(['name' => 'Daniel Lim']);
    User::factory()->create(['name' => 'Kavitha']);
    User::factory()->admin()->create(['name' => 'Daniel Admin']);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.customers.index', ['search' => 'daniel']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/customers/index')
            ->has('customers.data', 1)
            ->where('customers.data.0.id', $match->id));
});

test('admins can block and unblock a customer', function () {
    $customer = User::factory()->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.customers.status', $customer), ['status' => 'blocked'])
        ->assertInertiaFlash('toast.type', 'success');

    expect($customer->refresh()->isBlocked())->toBeTrue();

    $this->actingAs($admin)
        ->patch(route('admin.customers.status', $customer), ['status' => 'active']);

    expect($customer->refresh()->isBlocked())->toBeFalse();
});

test('admin accounts cannot be blocked', function () {
    $otherAdmin = User::factory()->admin()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.customers.status', $otherAdmin), ['status' => 'blocked'])
        ->assertNotFound();

    expect($otherAdmin->refresh()->isBlocked())->toBeFalse();
});

test('the customer status must be active or blocked', function () {
    $customer = User::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.customers.status', $customer), ['status' => 'admin'])
        ->assertSessionHasErrors('status');

    expect($customer->refresh()->status)->toBe('active');
});
