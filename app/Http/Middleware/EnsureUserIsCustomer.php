<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The opposite of EnsureUserIsAdmin: only customers may browse and book cars.
 * Admins manage bookings from the admin area instead.
 */
class EnsureUserIsCustomer
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isAdmin()) {
            abort(403, 'Admins cannot make bookings. Use the admin area instead.');
        }

        return $next($request);
    }
}
