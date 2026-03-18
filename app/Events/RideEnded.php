<?php

namespace App\Events;

use Illuminate\Support\Facades\Storage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Ride;

class RideEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;

    /**
     * Create a new event instance.
     */
    public function __construct(Ride $ride)
    {
        $this->ride = $ride;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('passenger.' . $this->ride->passenger_id),
            new Channel('ride')
        ];
    }

    public function broadcastAs()
    {
        return 'ride.ended';
    }

    public function broadcastWith()
    {
        $this->ride->loadMissing(['driver.user']);

        $driverName = $this->ride->driver && $this->ride->driver->user ? $this->ride->driver->user->name : 'Unknown Driver';
        $driverPhone = $this->ride->driver && $this->ride->driver->user ? $this->ride->driver->user->phone : '';
        $driverRating = $this->ride->driver ? (float)$this->ride->driver->rating : 0.0;
        $driverProfile = $this->ride->driver && $this->ride->driver->profile_picture_path 
            ? Storage::disk('supabase')->url($this->ride->driver->profile_picture_path) 
            : '';

        // Calculate duration and distance if available
        $distanceKm = (float)($this->ride->actual_distance ?? 0.0);
        
        $durationMin = 0;
        if ($this->ride->actual_duration) {
            $durationMin = floor((int)$this->ride->actual_duration / 60);
        } elseif ($this->ride->started_at && $this->ride->completed_at) {
            $start = \Carbon\Carbon::parse($this->ride->started_at);
            $end = \Carbon\Carbon::parse($this->ride->completed_at);
            $durationMin = $end->diffInMinutes($start);
        }

        return [
            'ride_id' => $this->ride->id,
            'status' => strtoupper($this->ride->status),
            'driver' => [
                'id' => $this->ride->driver_id,
                'name' => $driverName,
                'phone' => $driverPhone,
                'rating' => $driverRating,
                'profile_picture' => $driverProfile,
            ],
            'trip' => [
                'origin' => [
                    'lat' => (float)$this->ride->origin_lat,
                    'lng' => (float)$this->ride->origin_lng,
                    'address' => $this->ride->pickup_address,
                ],
                'destination' => [
                    'lat' => (float)$this->ride->destination_lat,
                    'lng' => (float)$this->ride->destination_lng,
                    'address' => $this->ride->destination_address,
                ],
                'distance_km' => $distanceKm,
                'duration_min' => $durationMin,
                // encoded_route may not be readily available on ride model, checking if we can just stringify actual_route
                'encoded_route' => $this->ride->actual_route ?? '',
            ],
            'fare' => [
                'total' => (float)$this->ride->price,
                'payment_method' => $this->ride->payment_method ?? 'cash',
            ],
            'timestamps' => [
                'requested_at' => $this->ride->created_at ? $this->ride->created_at->toIso8601String() : null,
                'started_at' => $this->ride->started_at,
                'completed_at' => $this->ride->completed_at,
            ]
        ];
    }
}
