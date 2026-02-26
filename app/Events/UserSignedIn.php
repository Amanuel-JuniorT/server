<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserSignedIn implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public AuthenticatableContract $user;

    /**
     * Create a new event instance.
     */
    public function __construct(AuthenticatableContract $user)
    {
        $this->user = $user;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('admin');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'user.signed_in';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        // $id = method_exists($this->user, 'getAuthIdentifier') ? $this->user->getAuthIdentifier() : ($this->user->id ?? null);

        // $getAttribute = function (string $key) {
        //     if ($this->user instanceof Model) {
        //         return $this->user->getAttribute($key);
        //     }
        //     return property_exists($this->user, $key) ? $this->user->{$key} : null;
        // };

        // $name = $getAttribute('name');
        // $email = $getAttribute('email');
        // $role = $getAttribute('role');

        return [
            'user' => [
                'id' => "\$id",
                'name' => '$name',
                'email' => '$email',
                'role' => '$role',
            ],
        ];
    }
}
