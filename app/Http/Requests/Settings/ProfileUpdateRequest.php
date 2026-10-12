<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules($this->user()->id),
            ...$this->rentalDetailRules($this->user()->id),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ic_number.regex' => 'Enter your IC number like 990101-10-1234.',
            'ic_number.unique' => 'This IC number is already registered.',
            'license_expiry.after' => 'Your driving license has expired.',
            'phone.regex' => 'The phone number may only contain digits, spaces, + and -.',
        ];
    }
}
