<?php

namespace App\Http\Controllers;

use App\Actions\Bookings\RecordPayment;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\ToyyibPay;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pay a booking online with ToyyibPay (see App\Services\ToyyibPay for the flow).
 */
class PaymentController extends Controller
{
    public function __construct(private ToyyibPay $toyyibPay, private RecordPayment $recordPayment) {}

    /** Create a bill and send the customer to ToyyibPay's payment page. */
    public function start(Request $request, Booking $booking): Response
    {
        Gate::authorize('pay', $booking);

        if (! $this->toyyibPay->isConfigured()) {
            return $this->backWithToast('error', 'Online payment is not available right now. Please pay at the counter.');
        }

        try {
            $billCode = $this->toyyibPay->createBill(
                $booking,
                returnUrl: route('payments.toyyibpay.return'),
                callbackUrl: route('payments.toyyibpay.callback'),
            );
        } catch (RuntimeException $exception) {
            Log::warning($exception->getMessage(), ['booking' => $booking->booking_ref]);

            return $this->backWithToast('error', 'We could not reach the payment gateway. Please try again in a moment.');
        }

        $booking->payment->update(['gateway_bill_code' => $billCode]);

        // A full-page redirect: ToyyibPay is another website, not an Inertia page.
        return Inertia::location($this->toyyibPay->paymentUrl($billCode));
    }

    /** ToyyibPay sends the customer back here after paying (or giving up). */
    public function return(Request $request): RedirectResponse
    {
        $payment = Payment::with('booking')
            ->where('gateway_bill_code', (string) $request->query('billcode'))
            ->first();

        if (! $payment || $payment->booking->user_id !== $request->user()->id) {
            return $this->backWithToast('error', 'We could not find that payment.', to_route('bookings.index'));
        }

        if ($this->confirm($payment) || $payment->status === 'paid') {
            return $this->backWithToast('success', "Payment received for {$payment->booking->booking_ref}. Thank you!", to_route('bookings.index'));
        }

        return $this->backWithToast('error', 'The payment was not completed. You can try again from My bookings.', to_route('bookings.index'));
    }

    /**
     * Server-to-server notice from ToyyibPay. It is not trusted: confirm() asks
     * ToyyibPay's API whether the bill was really paid before anything is recorded.
     */
    public function callback(Request $request): HttpResponse
    {
        $payment = Payment::with('booking')
            ->where('gateway_bill_code', (string) $request->input('billcode'))
            ->first();

        if ($payment) {
            $this->confirm($payment);
        }

        return response('OK');
    }

    /** Record the payment if ToyyibPay confirms the bill was paid in full. */
    private function confirm(Payment $payment): bool
    {
        if ($payment->status !== 'pending' || $payment->gateway_bill_code === null) {
            return false;
        }

        $invoice = $this->toyyibPay->paidInvoiceNumber($payment->gateway_bill_code, (float) $payment->amount);

        return $invoice !== null
            && $this->recordPayment->handle($payment->booking, $invoice, method: 'Online Banking');
    }

    private function backWithToast(string $type, string $message, ?RedirectResponse $redirect = null): RedirectResponse
    {
        Inertia::flash('toast', ['type' => $type, 'message' => $message]);

        return $redirect ?? back();
    }
}
