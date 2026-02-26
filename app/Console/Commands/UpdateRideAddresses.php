<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ride;
use App\Services\GeocodingService;

class UpdateRideAddresses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rides:update-addresses {--limit=10 : Number of rides to process at once}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update ride addresses using reverse geocoding for rides with "Unknown address"';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $limit = $this->option('limit');
        $geocodingService = new GeocodingService();
        
        $this->info("Updating ride addresses (processing {$limit} rides)...");
        
        // Get rides that need address updates
        $rides = Ride::where('pickup_address', 'Unknown address')
                    ->orWhere('destination_address', 'Unknown address')
                    ->limit($limit)
                    ->get();
        
        if ($rides->isEmpty()) {
            $this->info('No rides found with "Unknown address". All addresses are up to date!');
            return;
        }
        
        $this->info("Found {$rides->count()} rides to update.");
        
        $progressBar = $this->output->createProgressBar($rides->count());
        $progressBar->start();
        
        $updated = 0;
        
        foreach ($rides as $ride) {
            try {
                $needsUpdate = false;
                
                // Update pickup address if needed
                if ($ride->pickup_address === 'Unknown address') {
                    $pickupAddress = $geocodingService->reverseGeocode($ride->origin_lat, $ride->origin_lng);
                    $ride->pickup_address = $pickupAddress;
                    $needsUpdate = true;
                }
                
                // Update destination address if needed
                if ($ride->destination_address === 'Unknown address') {
                    $destinationAddress = $geocodingService->reverseGeocode($ride->destination_lat, $ride->destination_lng);
                    $ride->destination_address = $destinationAddress;
                    $needsUpdate = true;
                }
                
                if ($needsUpdate) {
                    $ride->save();
                    $updated++;
                }
                
                $progressBar->advance();
                
                // Add a small delay to avoid rate limiting
                usleep(100000); // 0.1 second delay
                
            } catch (\Exception $e) {
                $this->error("Error updating ride {$ride->id}: " . $e->getMessage());
                $progressBar->advance();
            }
        }
        
        $progressBar->finish();
        $this->newLine();
        
        $this->info("Successfully updated {$updated} rides with proper addresses.");
        
        // Check if there are more rides to process
        $remainingCount = Ride::where('pickup_address', 'Unknown address')
                             ->orWhere('destination_address', 'Unknown address')
                             ->count();
        
        if ($remainingCount > 0) {
            $this->info("There are still {$remainingCount} rides with unknown addresses.");
            $this->info("Run the command again to process more rides: php artisan rides:update-addresses --limit={$limit}");
        } else {
            $this->info('All ride addresses have been updated!');
        }
    }
}