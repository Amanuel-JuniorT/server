<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsCompanyAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        // Check if user has the required methods and is a company admin
        if (!method_exists($user, 'isCompanyAdmin') || !$user->isCompanyAdmin()) {
            abort(403, 'Access denied. Company admin privileges required.');
        }

        if (!$user->company_id) {
            abort(403, 'Access denied. No company assigned to this admin.');
        }

        return $next($request);
    }
}
