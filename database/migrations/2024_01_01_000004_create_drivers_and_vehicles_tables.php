<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('drivers', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
      $table->string('license_number');
      $table->date('license_expiry')->nullable();
      $table->integer('experience_years')->nullable();
      $table->string('emergency_contact_name')->nullable();
      $table->string('emergency_contact_phone')->nullable();
      $table->enum('status', ['available', 'on_ride', 'offline'])->default('offline');
      $table->enum('approval_state', ['pending', 'approved', 'rejected'])->default('pending');
      $table->boolean('pooling_enabled')->default(true);
      $table->string('reject_message')->nullable();
      $table->string('license_image_path')->default('license_images/default.png');
      $table->string('profile_picture_path')->default('profile_pictures/default.png');
      $table->decimal('rating', 3, 2)->default(5.00);
      $table->integer('total_ratings')->default(0);
      $table->json('rating_breakdown')->nullable();
      $table->unsignedInteger('accepted_rides')->default(0);
      $table->unsignedInteger('rejected_rides')->default(0);
      $table->timestamps();
    });

    Schema::create('vehicles', function (Blueprint $table) {
      $table->id();
      $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');
      $table->enum('vehicle_type', ['car', 'motorcycle']);
      $table->integer('capacity');
      $table->boolean('has_air_conditioning')->default(false);
      $table->boolean('has_child_seat')->default(false);
      $table->string('make');
      $table->string('model');
      $table->string('plate_number')->unique();
      $table->string('color');
      $table->integer('year');
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('vehicles');
    Schema::dropIfExists('drivers');
  }
};
