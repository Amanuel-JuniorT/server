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
        // Check if user already exists (double check)
        if (User::where('phone', $this->phone)->exists()) {
            return;
        }

        // Create the user
        $user = User::create([
            'name' => $this->name,
            'phone' => $this->phone,
            'role' => 'passenger',
            'password' => Hash::make(Str::random(10)),
            'status' => 'approved',
        ]);

        // Create a wallet for the new passenger
        Wallet::create([
            'user_id' => $user->id,
            'balance' => 0,
        ]);

        // Log or notify if needed
    }
}
