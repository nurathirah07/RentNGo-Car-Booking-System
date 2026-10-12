<?php

use App\Models\User;

test('customers can save their rental details', function () {
    $user = User::factory()->create();
    $expiry = today()->addYears(3)->toDateString();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => '012-3456789',
            'ic_number' => '990101-10-1234',
            'license_number' => 'D12345678',
            'license_expiry' => $expiry,
            'address' => 'Shah Alam, Selangor',
        ])
        ->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->ic_number)->toBe('990101-10-1234')
        ->and($user->license_expiry->toDateString())->toBe($expiry)
        ->and($user->hasCompleteProfile())->toBeTrue();
});

test('rental details are validated', function (array $fields, string $field, string $message) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            ...$fields,
        ])
        ->assertSessionHasErrors([$field => $message]);
})->with([
    'IC in the wrong format' => [['ic_number' => '990101101234'], 'ic_number', 'Enter your IC number like 990101-10-1234.'],
    'expired license' => fn () => [['license_expiry' => today()->subDay()->toDateString()], 'license_expiry', 'Your driving license has expired.'],
]);

test('an IC number can only belong to one account', function () {
    User::factory()->create(['ic_number' => '990101-10-1234']);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'ic_number' => '990101-10-1234',
        ])
        ->assertSessionHasErrors(['ic_number' => 'This IC number is already registered.']);
});
