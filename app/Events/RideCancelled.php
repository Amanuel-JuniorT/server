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
use App\Models\Ride;

class RideCancelled implements ShouldBroadcastNow
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
     * @return \Illuminate\Broadcasting\Channel
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('passenger.' . $this->ride->passenger_id),
            new Channel('ride')
        ];

        if ($this->ride->driver_id) {
            $channels[] = new PrivateChannel('driver.' . $this->ride->driver_id);
        }

        return $channels;
    }

    public function broadcastAs()
    {
        return 'ride.cancelled';
    }

    public function broadcastWith()
    {
        return [
            'ride' => $this->ride,
        ];
    }
}
