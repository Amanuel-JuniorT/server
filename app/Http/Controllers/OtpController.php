<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\OtpNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OtpController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('auth/otp');
    }

    public function send(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $phone = $this->normalizeE164($validated['phone']);

        $user = User::firstOrCreate(
            ['phone' => $phone],
            [
                'name' => $phone,
                'email' => null,
                'password' => bcrypt(Str::random(40)),
                'role' => 'passenger',
                'is_active' => true,
            ]
        );

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $ttlMinutes = 10;

        Cache::put($this->cacheKey($phone), $otp, now()->addMinutes($ttlMinutes));

        $user->notify(new OtpNotification($otp, $ttlMinutes));

        return back()->with('status', 'OTP sent to WhatsApp');
    }

    private function cacheKey(string $phone): string
    {
        return 'otp:' . $phone;
    }

    private function normalizeE164(string $phone): string
    {
        $trimmed = preg_replace('/\s+/', '', $phone);
        if (! str_starts_with($trimmed, '+')) {
            return '+' . ltrim($trimmed, '0');
        }
        return $trimmed;
    }
}
