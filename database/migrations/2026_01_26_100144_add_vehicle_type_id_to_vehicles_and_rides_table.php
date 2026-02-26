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
        Schema::table('vehicles', function (Blueprint $table) {
            $table->foreignId('vehicle_type_id')->nullable()->after('driver_id')->constrained('vehicle_types')->onDelete('set null');
        });

        Schema::table('rides', function (Blueprint $table) {
            $table->foreignId('vehicle_type_id')->nullable()->after('driver_id')->constrained('vehicle_types')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vehicle_type_id');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vehicle_type_id');
        });
    }
};
