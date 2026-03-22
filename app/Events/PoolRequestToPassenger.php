<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Pooling;

class PoolRequestToPassenger implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $pooling;
    public $poolerName;
    public $poolerRating;
    public $routeMatch;
    public $savings;
    public $detourMinutes;

    /**
     * Create a new event instance.
     */
    public function __construct(Pooling $pooling, $poolerName, $poolerRating, $routeMatch, $savings, $detourMinutes = 4)
    {
        $this->pooling = $pooling;
        $this->poolerName = $poolerName;
        $this->poolerRating = $poolerRating;
        $this->routeMatch = $routeMatch;
        $this->savings = $savings;
        $this->detourMinutes = $detourMinutes;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel('private-passenger.' . $this->pooling->ride->passenger_id);
    }

    public function broadcastWith()
    {
        return [
            'pooling_id' => $this->pooling->id,
            'pooler_name' => $this->poolerName,
            'pooler_rating' => $this->poolerRating,
            'route_match' => $this->routeMatch,
            'savings' => $this->savings,
            'detour_minutes' => $this->detourMinutes,
            'timeout_seconds' => 20,
        ];
    }

    public function broadcastAs()
    {
        return 'pool.request';
    }
}
