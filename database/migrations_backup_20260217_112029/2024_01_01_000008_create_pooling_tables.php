<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('poolings', function (Blueprint $table) {
      $table->id();
      $table->foreignId('ride_id')->constrained('rides')->onDelete('cascade');
      $table->foreignId('passenger_id')->constrained('users')->onDelete('cascade');
      $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');
      $table->decimal('origin_lat', 10, 7);
      $table->decimal('origin_lng', 10, 7);
      $table->decimal('destination_lat', 10, 7);
      $table->decimal('destination_lng', 10, 7);
      $table->string('status', 50); // Broad status string due to many enum values across migrations
      $table->timestamp('requested_at')->nullable();
      $table->timestamp('started_at')->nullable();
      $table->timestamp('completed_at')->nullable();
      $table->timestamps();
    });

    Schema::create('pool_rides', function (Blueprint $table) {
      $table->id();
      $table->foreignId('driver_id')->nullable()->constrained('drivers')->onDelete('set null');
      $table->enum('status', ['pending', 'active', 'completed'])->default('pending');
      $table->decimal('origin_lat', 10, 6);
      $table->decimal('origin_lng', 10, 6);
      $table->decimal('destination_lat', 10, 6);
      $table->decimal('destination_lng', 10, 6);
      $table->boolean('is_straight_hail')->default(false);
      $table->boolean('cash_payment')->default(true);
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('pool_rides');
    Schema::dropIfExists('poolings');
  }
};
