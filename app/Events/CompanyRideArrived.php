<?php

namespace App\Events;

use App\Models\CompanyGroupRideInstance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanyRideArrived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $rideInstance;
    public $optimizedPickupOrder;

    /**
     * Create a new event instance.
     * 
     * @param CompanyGroupRideInstance $rideInstance
     * @param array $optimizedPickupOrder
     */
    public function __construct(CompanyGroupRideInstance $rideInstance, array $optimizedPickupOrder = [])
    {
        $this->rideInstance = $rideInstance;
        $this->optimizedPickupOrder = $optimizedPickupOrder;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('driver.' . $this->rideInstance->driver_id),
            new Channel('company-rides')
        ];
    }

    public function broadcastAs()
    {
        return 'company_ride.arrived';
    }

    public function broadcastWith()
    {
        return [
            'ride_instance_id' => $this->rideInstance->id,
            'scheduled_time' => $this->rideInstance->scheduled_time->toIso8601String(),
            'pickup_address' => $this->rideInstance->pickup_address,
            'optimized_pickup_order' => $this->optimizedPickupOrder,
            'status' => 'arrived'
        ];
    }
}
