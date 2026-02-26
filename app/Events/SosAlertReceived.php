<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use App\Models\SosAlert;

class SosAlertReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $alert;

    public function __construct(SosAlert $alert)
    {
        $this->alert = $alert->load('user');
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('admin-alerts'),
        ];
    }

    public function broadcastAs()
    {
        return 'sos.received';
    }
}
