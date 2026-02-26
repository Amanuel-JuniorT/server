<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PassengerDroppedOff implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $driver;
    public $data;

    /**
     * Create a new event instance.
     */
    public function __construct($driver, $data)
    {
        $this->driver = $driver;
        $this->data = $data;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel('private-driver.' . $this->driver->id);
    }

    public function broadcastWith()
    {
        return [
            'status' => 'passenger_dropped_off',
            'details' => $this->data
        ];
    }

    public function broadcastAs()
    {
        return 'pool.passenger_dropped_off';
    }
}
