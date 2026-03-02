<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewRideRequested implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;

    public function __construct($ride)
    {
        $this->ride = $ride;
    }

    public function broadcastOn()
    {
        $driverId = $this->ride->driver_id ?: $this->ride->notified_driver_id;
        return new Channel('driver.' . $driverId);
    }

    public function broadcastAs()
    {
        return 'RideRequested';
    }

    public function broadcastWith()
    {
        return [
            'ride_id' => $this->ride['id'],
            'pickup_address' => $this->ride['pickup_address'],
            'pickup_lat' => $this->ride['origin_lat'],
            'pickup_lng' => $this->ride['origin_lng'],
            'destination_lat' => $this->ride['destination_lat'],
            'destination_lng' => $this->ride['destination_lng'],
            'destination_address' => $this->ride['destination_address'],
            'fare' => $this->ride['price'],
            'passenger_name' => $this->ride->passenger->name ?? 'Passenger',
        ];
    }
}
