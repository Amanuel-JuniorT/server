<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Show the email verification prompt page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $verificationUrl = null;
        if (app()->environment('local')) {
            $user = $request->user();
            $verificationUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())]
            );
        }

        return $request->user()->hasVerifiedEmail()
            ? redirect()->intended(route('dashboard', absolute: false))
            : Inertia::render('auth/verify-email', [
                'status' => $request->session()->get('status'),
                'verificationUrl' => $verificationUrl,
            ]);
    }
}
