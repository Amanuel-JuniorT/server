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
        Schema::create('poolings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ride_id')->constrained('rides')->onDelete('cascade');
            $table->foreignId('passenger_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');

            $table->decimal('origin_lat', 10, 7);
            $table->decimal('origin_lng', 10, 7);
            $table->decimal('destination_lat', 10, 7);
            $table->decimal('destination_lng', 10, 7);

            $table->enum('status', ['requested', 'accepted', 'in_progress', 'completed', 'cancelled']);
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('poolings');
    }
};
