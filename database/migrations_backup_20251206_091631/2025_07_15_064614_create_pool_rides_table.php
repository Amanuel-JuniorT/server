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
        Schema::create('pool_rides', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('driver_id')->nullable();
        $table->enum('status', ['pending', 'active', 'completed'])->default('pending');
        $table->decimal('origin_lat', 10, 6);
        $table->decimal('origin_lng', 10, 6);
        $table->decimal('destination_lat', 10, 6);
        $table->decimal('destination_lng', 10, 6);
        $table->boolean('is_straight_hail')->default(false);
        $table->boolean('cash_payment')->default(true);
        $table->timestamps();

    
        $table->foreign('driver_id')->references('id')->on('drivers')->onDelete('set null');
        
    
    });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pool_rides');
    }
};
