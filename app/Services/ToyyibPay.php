<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Online payments (FPX online banking and cards) through ToyyibPay, a Malaysian gateway.
 *
 * Flow:
 *  1. createBill() asks ToyyibPay for a bill and we send the customer to its payment page.
 *  2. The customer pays; ToyyibPay calls our callback URL (server to server) and
 *     sends the customer back to our return URL.
 *  3. Neither of those requests is trusted on its own: isPaid() asks ToyyibPay's API
 *     directly whether the bill was really paid, and for the right amount.
 *
 * Sandbox: https://dev.toyyibpay.com (set TOYYIBPAY_SANDBOX=true, the default).
 */
class ToyyibPay
{
    /** True once a secret key and category code are set in .env. */
    public function isConfigured(): bool
    {
        return filled(config('services.toyyibpay.secret_key'))
            && filled(config('services.toyyibpay.category_code'));
    }

    /** e.g. https://dev.toyyibpay.com */
    public function baseUrl(): string
    {
        return config('services.toyyibpay.sandbox') ? 'https://dev.toyyibpay.com' : 'https://toyyibpay.com';
    }

    /** The page where the customer pays the bill. */
    public function paymentUrl(string $billCode): string
    {
        return $this->baseUrl().'/'.$billCode;
    }

    /**
     * Create a bill for the booking's total and return its bill code.
     *
     * @throws RuntimeException when ToyyibPay does not return a bill code
     */
    public function createBill(Booking $booking, string $returnUrl, string $callbackUrl): string
    {
        $booking->loadMissing(['user', 'vehicle']);

        $response = Http::asForm()->timeout(15)->post($this->baseUrl().'/index.php/api/createBill', [
            'userSecretKey' => config('services.toyyibpay.secret_key'),
            'categoryCode' => config('services.toyyibpay.category_code'),
            'billName' => Str::limit('RentNGo '.$booking->booking_ref, 30, ''),
            'billDescription' => Str::limit("{$booking->vehicle->full_name}, {$booking->total_days} day(s)", 100, ''),
            'billPriceSetting' => 1, // fixed amount
            'billPayorInfo' => 1, // ask for payer details
            'billAmount' => $this->toCents((float) $booking->total_amount),
            'billReturnUrl' => $returnUrl,
            'billCallbackUrl' => $callbackUrl,
            'billExternalReferenceNo' => $booking->booking_ref,
            'billTo' => $booking->user->name,
            'billEmail' => $booking->user->email,
            'billPhone' => $booking->user->phone ?? '',
            'billPaymentChannel' => '2', // FPX and card
            'billExpiryDays' => 1,
        ]);

        $billCode = $response->json('0.BillCode');

        if (! $response->successful() || ! is_string($billCode) || $billCode === '') {
            throw new RuntimeException('ToyyibPay did not create a bill: '.Str::limit($response->body(), 200));
        }

        return $billCode;
    }

    /**
     * Ask ToyyibPay whether the bill was paid in full.
     *
     * @return string|null the gateway's invoice number when paid, otherwise null
     */
    public function paidInvoiceNumber(string $billCode, float $expectedAmount): ?string
    {
        $response = Http::asForm()->timeout(15)->post($this->baseUrl().'/index.php/api/getBillTransactions', [
            'billCode' => $billCode,
            'billpaymentStatus' => 1, // successful payments only
        ]);

        if (! $response->successful() || ! is_array($response->json())) {
            return null;
        }

        foreach ($response->json() as $transaction) {
            $isPaid = ($transaction['billpaymentStatus'] ?? null) == 1;
            $amountMatches = abs((float) ($transaction['billpaymentAmount'] ?? 0) - $expectedAmount) < 0.01;

            if ($isPaid && $amountMatches) {
                return (string) ($transaction['billpaymentInvoiceNo'] ?? $billCode);
            }
        }

        return null;
    }

    private function toCents(float $amount): int
    {
        return (int) round($amount * 100);
    }
}
