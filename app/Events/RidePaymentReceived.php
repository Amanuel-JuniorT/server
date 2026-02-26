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

class RidePaymentReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;
    public $amount;

    /**
     * Create a new event instance.
     */
    public function __construct(Ride $ride, $amount)
    {
        $this->ride = $ride;
        $this->amount = $amount;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): Channel
    {
        // Broadcast to the driver's channel
        return new Channel('driver.' . $this->ride->driver_id);
    }

    public function broadcastAs()
    {
        return 'ride.payment.received';
    }

    public function broadcastWith()
    {
        return [
            'ride_id' => $this->ride->id,
            'amount' => $this->amount,
            'passenger_id' => $this->ride->passenger_id,
            'message' => 'Payment received for ride #' . $this->ride->id,
        ];
    }
}
