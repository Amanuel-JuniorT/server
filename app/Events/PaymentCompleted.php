<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentCompleted implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public $paymentData;
  public $driverId;

  /**
   * Create a new event instance.
   */
  public function __construct($paymentData, $driverId)
  {
    $this->paymentData = $paymentData;
    $this->driverId = $driverId;
  }

  /**
   * Get the channels the event should broadcast on.
   */
  public function broadcastOn(): array
  {
    return [
      new PrivateChannel('payment.' . $this->driverId),
    ];
  }

  /**
   * The event's broadcast name.
   */
  public function broadcastAs(): string
  {
    return 'payment.completed';
  }

  /**
   * Get the data to broadcast.
   */
  public function broadcastWith(): array
  {
    return $this->paymentData;
  }
}
