<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegisterManualPassengerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected string $phone,
        protected string $name = 'New Passenger'
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Check if user already exists
        $user = User::where('phone', $this->phone)->first();

        if (!$user) {
            // Create the user
            $user = User::create([
                'name' => $this->name,
                'phone' => $this->phone,
                'role' => 'passenger',
                'password' => Hash::make(Str::random(10)),
                'status' => 'approved',
            ]);
        }

        // Ensure a wallet exists for the passenger
        if ($user && !Wallet::where('user_id', $user->id)->exists()) {
            Wallet::create([
                'user_id' => $user->id,
                'balance' => 0,
            ]);
        }
    }
}
