<?php

namespace App\Events;

use App\Models\CompanyPaymentReceipt;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanyPaymentReceiptUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $receipt;
    public $status;
    public $message;

    /**
     * Create a new event instance.
     *
     * @param CompanyPaymentReceipt $receipt
     * @param string|null $message
     */
    public function __construct(CompanyPaymentReceipt $receipt, $message = null)
    {
        $this->receipt = $receipt;
        $this->status = $receipt->status;
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('company.' . $this->receipt->company_id),
            new PrivateChannel('admin')
        ];
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs()
    {
        return 'company_payment_receipt.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith()
    {
        return [
            'id' => $this->receipt->id,
            'company_id' => $this->receipt->company_id,
            'amount' => $this->receipt->amount,
            'status' => $this->status,
            'message' => $this->message,
            'updated_at' => $this->receipt->updated_at->toIso8601String(),
        ];
    }
}
