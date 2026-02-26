<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\SosAlert;
use App\Models\Driver;
use App\Models\Transaction;
use App\Events\GlobalAdminNotification;

class CheckPendingApprovals extends Command
{
    protected $signature = 'app:check-pending-approvals';
    protected $description = 'Check for pending actions requiring admin approval';

    public function handle()
    {
        $sosCount = SosAlert::where('status', 'open')->count();
        $driverCount = Driver::where('status', 'pending')->count();
        $paymentCount = Transaction::where('status', 'pending')->where('type', 'deposit')->count();

        if ($sosCount > 0) {
            broadcast(new GlobalAdminNotification("There are {$sosCount} active SOS alerts!", 'error', ['link' => '/sos']));
        }

        if ($driverCount > 0) {
            broadcast(new GlobalAdminNotification("{$driverCount} drivers are awaiting approval.", 'warning', ['link' => '/drivers']));
        }

        if ($paymentCount > 0) {
            broadcast(new GlobalAdminNotification("{$paymentCount} payments are awaiting verification.", 'info', ['link' => '/payment-receipts']));
        }

        $this->info('Pending approvals check completed.');
    }
}
