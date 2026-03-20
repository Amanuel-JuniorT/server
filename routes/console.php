<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule job to expire old company rides
Schedule::call(function () {
    \App\Jobs\ExpireOldCompanyRides::dispatch();
})->everyTwoHours()->name('expire-old-company-rides');

// Schedule daily generation of corporate ride groups
Schedule::command('company:generate-rides')->dailyAt('00:01');

// Schedule check for scheduled ride notifications
Schedule::command('rides:check-scheduled')->everyMinute();

Schedule::command('rides:expire')->everyMinute();

// Schedule daily financial audit for transaction integrity
Schedule::call(function () {
    (new \App\Services\TransactionVerificationService())->auditAllWallets();
})->dailyAt('03:00')->name('audit-financial-integrity');
