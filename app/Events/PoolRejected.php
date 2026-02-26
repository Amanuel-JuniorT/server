<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PoolRejected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $passengerId;
    public $poolingId;
    public $reason;

    /**
     * Create a new event instance.
     */
    public function __construct($passengerId, $poolingId, $reason = 'rejected')
    {
        $this->passengerId = $passengerId;
        $this->poolingId = $poolingId;
        $this->reason = $reason;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel('private-passenger.' . $this->passengerId);
    }

    public function broadcastWith()
    {
        return [
            'pooling_id' => $this->poolingId,
            'status' => 'rejected',
            'reason' => $this->reason,
        ];
    }

    public function broadcastAs()
    {
        return 'pool.rejected';
    }
}
