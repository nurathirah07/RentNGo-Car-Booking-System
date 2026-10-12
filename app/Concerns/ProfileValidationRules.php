<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    /**
     * Details a customer needs before they can rent a car (see User::hasCompleteProfile()).
     * They are optional here so a customer can save their profile step by step.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function rentalDetailRules(int $userId): array
    {
        return [
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\- ]+$/'],
            // Malaysian MyKad format, e.g. 990101-10-1234
            'ic_number' => ['nullable', 'string', 'regex:/^\d{6}-\d{2}-\d{4}$/', Rule::unique(User::class)->ignore($userId)],
            'license_number' => ['nullable', 'string', 'max:30'],
            'license_expiry' => ['nullable', 'date', 'after:today'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}
