<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideSearchingUpdate implements ShouldBroadcastNow
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  /**
   * Create a new event instance.
   */
  public function __construct(
    public $passengerId,
    public $radius,
    public $message
  ) {}

  /**
   * Get the channels the event should broadcast on.
   */
  public function broadcastOn(): Channel
  {
    return new PrivateChannel('passenger.' . $this->passengerId);
  }

  /**
   * The event name to broadcast as.
   */
  public function broadcastAs(): string
  {
    return 'ride.searching_update';
  }

  /**
   * Get the data to broadcast.
   */
  public function broadcastWith(): array
  {
    return [
      'status' => 'searching_update',
      'radius' => (string) $this->radius,
      'message' => $this->message,
    ];
  }
}
