<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets the request through only if the logged-in user is an admin.
 * Customers who try to open an /admin page get a 403 Forbidden error.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'You do not have permission to access this page.');
        }

        return $next($request);
    }
}
