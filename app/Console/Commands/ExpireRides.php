<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ride;
use App\Events\RideStatusUpdated; // Assuming this event exists or similar
use Carbon\Carbon;

class ExpireRides extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'rides:expire';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Expire ride requests older than X minutes';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    // 1. Expire 'requested' rides older than 15 minutes
    $requestedThreshold = Carbon::now()->subMinutes(15);
    $expiredRequested = Ride::where('status', 'requested')
      ->where('created_at', '<', $requestedThreshold)
      ->get();

    // 2. Expire 'searching' rides older than 30 minutes
    $searchingThreshold = Carbon::now()->subMinutes(30);
    $expiredSearching = Ride::where('status', 'searching')
      ->where('created_at', '<', $searchingThreshold)
      ->get();

    $expiredRides = $expiredRequested->merge($expiredSearching);
    $count = 0;

    foreach ($expiredRides as $ride) {
      $ride->status = 'expired';
      $ride->save();

      // Broadcast event if needed
      // broadcast(new RideStatusUpdated($ride));

      $this->info("Expired ride ID: {$ride->id} (Status was: {$ride->getOriginal('status')})");
      $count++;
    }

    $this->info("Expired {$count} rides.");
  }
}
