<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Pooling;

class PoolRequestToDriver implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $pooling;
    public $poolerName;
    public $poolerRating;
    public $routeMatch;
    public $extraEarnings;
    public $pickupDetour;

    /**
     * Create a new event instance.
     */
    public function __construct(Pooling $pooling, $poolerName, $poolerRating, $routeMatch, $extraEarnings, $pickupDetour)
    {
        $this->pooling = $pooling;
        $this->poolerName = $poolerName;
        $this->poolerRating = $poolerRating;
        $this->routeMatch = $routeMatch;
        $this->extraEarnings = $extraEarnings;
        $this->pickupDetour = $pickupDetour;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel('private-driver.' . $this->pooling->driver_id);
    }

    public function broadcastWith()
    {
        return [
            'pooling_id' => $this->pooling->id,
            'pooler_name' => $this->poolerName,
            'pooler_rating' => $this->poolerRating,
            'route_match' => $this->routeMatch,
            'extra_earnings' => $this->extraEarnings,
            'pickup_detour' => $this->pickupDetour,
            'timeout_seconds' => 30,
        ];
    }

    public function broadcastAs()
    {
        return 'pool.driver-request';
    }
}
