<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Pooling;

class PoolConfirmed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $pooling;
    public $poolRideId;

    /**
     * Create a new event instance.
     */
    public function __construct(Pooling $pooling, $poolRideId)
    {
        $this->pooling = $pooling;
        $this->poolRideId = $poolRideId;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('private-passenger.' . $this->pooling->ride->passenger_id),
            new PrivateChannel('private-passenger.' . $this->pooling->passenger_id),
            new PrivateChannel('private-driver.' . $this->pooling->driver_id),
        ];
    }

    public function broadcastWith()
    {
        return [
            'pooling_id' => $this->pooling->id,
            'pool_ride_id' => $this->poolRideId,
            'status' => 'confirmed',
        ];
    }

    public function broadcastAs()
    {
        return 'pool.confirmed';
    }
}
