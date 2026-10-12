<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs on every web request. If an admin blocks a customer while that customer
 * is logged in, their very next click logs them out (the login check in
 * FortifyServiceProvider only stops NEW logins).
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isBlocked()) {
            Auth::guard('web')->logout();

            // Throw away the old session so it can't be reused.
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withErrors(['email' => 'Your account has been blocked. Please contact RentNGo.']);
        }

        return $next($request);
    }
}
