<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;
use App\Models\Ride;

class RideStatusChanged implements ShouldBroadcastNow
{
    use SerializesModels;

    public $rideId;
    public $status;
    public $driverId;

    public function __construct(Ride $ride)
    {
        $this->rideId   = $ride->id;
        $this->status   = $ride->status;      // accepted, rejected
        $this->driverId = $ride->driver_id;
    }

    public function broadcastOn()
    {
        return [
            new Channel('ride.' . $this->rideId),
            new Channel('ride')
        ];
    }

    public function broadcastAs()
    {
        return 'ride.status_changed';
    }

    public function broadcastWith()
    {
        return [
            'ride_id'   => $this->rideId,
            'status'    => $this->status,
            'driver_id' => $this->driverId,
            'notified_driver_name' => Ride::find($this->rideId)->notified_driver_name,
            'notified_drivers_count' => Ride::find($this->rideId)->notified_drivers_count,
        ];
    }
}
