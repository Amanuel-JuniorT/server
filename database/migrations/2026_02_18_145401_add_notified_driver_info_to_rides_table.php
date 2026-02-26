<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->unsignedBigInteger('notified_driver_id')->nullable()->after('driver_id');
            $table->integer('notified_drivers_count')->default(0)->after('notified_driver_id');

            $table->foreign('notified_driver_id')->references('id')->on('drivers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropForeign(['notified_driver_id']);
            $table->dropColumn(['notified_driver_id', 'notified_drivers_count']);
        });
    }
};
