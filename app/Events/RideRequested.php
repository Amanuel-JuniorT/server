<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideRequested implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $driverId;
    public $rideData;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($driverId, $rideData)
    {
        $this->driverId = $driverId;
        $this->rideData = $rideData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new Channel('driver.' . $this->driverId);
    }

    /**
     * The event data to broadcast.
     */
    public function broadcastWith()
    {
        return $this->rideData;
    }

    /**
     * The event name to broadcast as.
     */
    public function broadcastAs()
    {
        return 'RideRequested';
    }
}
