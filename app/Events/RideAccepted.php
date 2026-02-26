<?php

namespace App\Events;

use App\Models\Driver;
use App\Models\Ride;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideAccepted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    protected $assigned_driver_data;
    protected $passenger_id;


    /**
     * Create a new event instance.
     */
    public function __construct($passenger_id, $assigned_driver_data)
    {
        $this->assigned_driver_data = $assigned_driver_data;
        $this->passenger_id = $passenger_id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     *
     */
    public function broadcastOn()
    {
        return [
            new PrivateChannel('passenger.' . $this->passenger_id),
            new Channel('ride')
        ];
    }

    public function broadcastAs()
    {
        return 'ride.accepted';
    }

    public function broadcastWith()
    {
        return [
            'driverName' => $this->assigned_driver_data['driver_name'],
            'driverPhone' => $this->assigned_driver_data['driver_phone'],
            'driverProfile' => $this->assigned_driver_data['driver_profile'],
            'vehicleMake' => $this->assigned_driver_data['vehicle_make'],
            'vehicleModel' => $this->assigned_driver_data['vehicle_model'],
            'plateNumber' => $this->assigned_driver_data['plate_number'],
            'vehicleColor' => $this->assigned_driver_data['vehicle_color']
        ];
    }
}
