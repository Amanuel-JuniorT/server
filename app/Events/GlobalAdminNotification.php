<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class GlobalAdminNotification implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $type;
    public $data;

    public function __construct($message, $type = 'info', $data = [])
    {
        $this->message = $message;
        $this->type = $type;
        $this->data = $data;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('admin-alerts'),
        ];
    }

    public function broadcastAs()
    {
        return 'admin.notification';
    }
}
