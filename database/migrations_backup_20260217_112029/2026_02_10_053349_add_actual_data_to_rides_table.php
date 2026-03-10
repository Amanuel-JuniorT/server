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
            $table->decimal('actual_distance', 10, 2)->nullable()->after('price');
            $table->integer('actual_duration')->nullable()->after('actual_distance'); // in minutes
            $table->integer('waiting_minutes')->nullable()->after('actual_duration');
            $table->decimal('calculated_fare', 10, 2)->nullable()->after('waiting_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropColumn(['actual_distance', 'actual_duration', 'waiting_minutes', 'calculated_fare']);
        });
    }
};
