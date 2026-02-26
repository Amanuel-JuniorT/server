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
            if (!Schema::hasColumn('rides', 'pickup_address')) {
                $table->string('pickup_address')->nullable();
            }
            if (!Schema::hasColumn('rides', 'destination_address')) {
                $table->string('destination_address')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropColumn('pickup_address');
            $table->dropColumn('destination_address');
        });
    }
};
