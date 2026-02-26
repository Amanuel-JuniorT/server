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

class SendPromotion implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $title;
    public $message;
    public $data;
    public $channelName;

    /**
     * Create a new event instance.
     */
    public function __construct($title, $message, $data = [], $channelName = 'promotions')
    {
        $this->title = $title;
        $this->message = $message;
        $this->data = $data;
        $this->channelName = $channelName;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): Channel
    {
        return new Channel($this->channelName);
    }

    public function broadcastWith()
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'data' => $this->data,
        ];
    }

    public function broadcastAs()
    {
        return "backend.message";
    }
}
