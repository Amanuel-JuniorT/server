<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = app('db')->table('wallets')->select('user_id')->groupBy('user_id')->havingRaw('COUNT(id) > 1')->pluck('user_id');
foreach ($users as $uid) {
    if (!$uid) continue;
    $wallets = \App\Models\Wallet::where('user_id', $uid)->orderBy('id', 'asc')->get();
    $primary = $wallets->first();
    foreach ($wallets->skip(1) as $w) {
        $primary->balance += $w->balance;
        $primary->save();
        \App\Models\Transaction::where('wallet_id', $w->id)->update(['wallet_id' => $primary->id]);
        $w->delete();
        echo "Merged wallet {$w->id} into {$primary->id}\n";
    }
}
echo "Done merging duplicate wallets.\n";
