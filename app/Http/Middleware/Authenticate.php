<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Redirect unauthorized requests.
     */
    protected function redirectTo($request)
    {
        if (!$request->expectsJson()) {
            return route('login'); // Or use abort(401)
        }
    }

    /**
     * Handle unauthenticated request.
     */
    public function handle($request, Closure $next, ...$guards)
    {
        if ($this->auth->guard()->guest()) {
            return response()->json([
                'message' => 'Missing auth token, please log in again.'
            ], 401);
        }

        return $next($request);
    }
}
