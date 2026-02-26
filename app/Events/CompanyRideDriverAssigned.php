<?php

namespace App\Events;

use App\Models\CompanyGroupRideInstance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanyRideDriverAssigned implements ShouldBroadcastNow
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public $ride;

  /**
   * Create a new event instance.
   */
  public function __construct(CompanyGroupRideInstance $ride)
  {
    $this->ride = $ride->load(['driver.user', 'driver.vehicle', 'company', 'employee']);
  }

  /**
   * Get the channels the event should broadcast on.
   *
   * @return array<int, \Illuminate\Broadcasting\Channel>
   */
  public function broadcastOn(): array
  {
    $channels = [
      new Channel('company.' . $this->ride->company_id)
    ];

    // Also broadcast to driver if assigned
    if ($this->ride->driver_id && $this->ride->driver && $this->ride->driver->user) {
      $channels[] = new Channel('driver.' . $this->ride->driver->user->id);
    }

    return $channels;
  }

  /**
   * The event's broadcast name.
   */
  public function broadcastAs(): string
  {
    return 'company-ride.driver-assigned';
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
        'driver_id' => $this->ride->driver_id,
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
        'started_at' => $this->ride->started_at ? $this->ride->started_at->toIso8601String() : null,
        'completed_at' => $this->ride->completed_at ? $this->ride->completed_at->toIso8601String() : null,
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
        'driver' => $this->ride->driver ? [
          'id' => $this->ride->driver->id,
          'license_number' => $this->ride->driver->license_number,
          'status' => $this->ride->driver->status,
          'profile_picture_path' => $this->ride->driver->profile_picture_path,
          'license_image_path' => $this->ride->driver->license_image_path,
          'user' => $this->ride->driver->user ? [
            'id' => $this->ride->driver->user->id,
            'name' => $this->ride->driver->user->name,
            'phone' => $this->ride->driver->user->phone,
            'email' => $this->ride->driver->user->email,
          ] : null,
          'vehicle' => $this->ride->driver->vehicle ? [
            'make' => $this->ride->driver->vehicle->make,
            'model' => $this->ride->driver->vehicle->model,
            'plate_number' => $this->ride->driver->vehicle->plate_number,
            'color' => $this->ride->driver->vehicle->color,
            'year' => $this->ride->driver->vehicle->year,
            'vehicle_type' => $this->ride->driver->vehicle->vehicle_type,
            'capacity' => $this->ride->driver->vehicle->capacity,
          ] : null,
        ] : null,
      ],
    ];
  }
}
