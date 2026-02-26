<?php

namespace App\Events;

use App\Models\CompanyRide;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideScheduled implements ShouldBroadcastNow
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public $ride;

  /**
   * Create a new event instance.
   */
  public function __construct(CompanyRide $ride)
  {
    $this->ride = $ride->load(['company', 'employee']);
  }

  /**
   * Get the channels the event should broadcast on.
   *
   * @return array<int, \Illuminate\Broadcasting\Channel>
   */
  public function broadcastOn(): array
  {
    $channels = [
      new Channel('company.' . $this->ride->company_id),
      new Channel('drivers') // Broadcast to all drivers
    ];

    // Also broadcast to employee if exists
    if ($this->ride->employee_id && $this->ride->employee) {
      $channels[] = new Channel('user.' . $this->ride->employee_id);
    }

    return $channels;
  }

  /**
   * The event's broadcast name.
   */
  public function broadcastAs(): string
  {
    return 'ride.scheduled';
  }

  /**
   * Get the data to broadcast.
   */
  public function broadcastWith(): array
  {
    return [
      'ride' => [
        'id' => $this->ride->id,
        'company_id' => $this->ride->company_id,
        'employee_id' => $this->ride->employee_id,
        'status' => $this->ride->status,
        'pickup_address' => $this->ride->pickup_address,
        'destination_address' => $this->ride->destination_address,
        'origin_lat' => $this->ride->origin_lat,
        'origin_lng' => $this->ride->origin_lng,
        'destination_lat' => $this->ride->destination_lat,
        'destination_lng' => $this->ride->destination_lng,
        'price' => $this->ride->price,
        'scheduled_time' => $this->ride->scheduled_time ? $this->ride->scheduled_time->toIso8601String() : null,
        'requested_at' => $this->ride->requested_at ? $this->ride->requested_at->toIso8601String() : null,
        'company' => $this->ride->company ? [
          'id' => $this->ride->company->id,
          'name' => $this->ride->company->name,
        ] : null,
        'employee' => $this->ride->employee ? [
          'id' => $this->ride->employee->id,
          'name' => $this->ride->employee->name,
          'phone' => $this->ride->employee->phone,
          'email' => $this->ride->employee->email,
        ] : null,
      ],
    ];
  }
}
