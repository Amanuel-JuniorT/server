<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestSchedule extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-schedule';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {

        // $deviceToken = \App\Models\DeviceToken::where('user_id', 11)->pluck('token')->toArray();

        // info($deviceToken);

        $deviceToken = \App\Models\DeviceToken::where('user_id', 11)->pluck('token')->toArray();


        $title = "Sleep Time";
        $body = "Your sleep time has arrived";


        \App\Jobs\SendFcmMessage::dispatchSync($deviceToken, $title, $body, ['key' => 'value']);

        // $now = now();



        // $expected_time = now()->setTime(20, 9);

        // if ($now->hour == $expected_time->hour && $now->minute == $expected_time->minute) {
        //     $deviceToken = \App\Models\DeviceToken::where('user_id', 11)->pluck('token')->toArray();


        //     $title = "Ride Scheduled Time";
        //     $body = "Your scheduled company ride is coming up at 11:00";


        //     \App\Jobs\SendFcmMessage::dispatchSync($deviceToken, $title, $body, ['key' => 'value']);
        // }
    }
}
