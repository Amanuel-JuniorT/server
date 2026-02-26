<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideRejected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    protected $ride;
    protected $driver;

    /**
     * Create a new event instance.
     */
    public function __construct($ride, $driver)
    {
        $this->ride = $ride;
        $this->driver = $driver;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): Channel
    {
        return new Channel('ride.' . $this->ride->id);
    }

    public function broadcastAs()
    {
        return 'ride.rejected';
    }

    public function broadcastWith()
    {
        return [
            'ride_id' => $this->ride->id,
            'driver_id' => $this->driver->id,
            'status' => 'rejected'
        ];
    }
}
