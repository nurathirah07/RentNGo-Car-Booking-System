<?php

use App\Models\User;

test('blocked users cannot log in', function () {
    $user = User::factory()->blocked()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertSessionHasErrors(['email' => 'Your account has been blocked. Please contact RentNGo.']);

    $this->assertGuest();
});

test('a wrong password is still rejected with the normal error', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('a user blocked while logged in is logged out on the next request', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $user->forceFill(['status' => 'blocked'])->save();

    $this->get(route('dashboard'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('admins cannot use the customer booking pages', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('cars.index'))
        ->assertForbidden();
});
