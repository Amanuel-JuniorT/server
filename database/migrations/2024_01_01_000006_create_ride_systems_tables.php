<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('company_group_ride_instances', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
      $table->foreignId('ride_group_id')->nullable()->constrained('company_ride_groups')->onDelete('cascade');
      $table->foreignId('employee_id')->nullable()->constrained('users')->onDelete('cascade');
      $table->foreignId('driver_id')->nullable()->constrained('drivers')->onDelete('set null');
      $table->string('pickup_address');
      $table->string('destination_address');
      $table->decimal('origin_lat', 10, 7);
      $table->decimal('origin_lng', 10, 7);
      $table->decimal('destination_lat', 10, 7);
      $table->decimal('destination_lng', 10, 7);
      $table->decimal('price', 10, 2)->nullable();
      $table->enum('status', ['requested', 'accepted', 'in_progress', 'completed', 'cancelled', 'expired'])->default('requested');
      $table->integer('assignment_retry_count')->default(0);
      $table->boolean('scheduled_notification_sent')->default(false);
      $table->timestamp('scheduled_time')->nullable();
      $table->timestamp('requested_at')->nullable();
      $table->timestamp('started_at')->nullable();
      $table->timestamp('completed_at')->nullable();
      $table->timestamps();
    });

    Schema::create('rides', function (Blueprint $table) {
      $table->id();
      $table->foreignId('passenger_id')->constrained('users');
      $table->foreignId('driver_id')->nullable()->constrained('drivers');
      $table->decimal('origin_lat', 10, 7);
      $table->decimal('origin_lng', 10, 7);
      $table->decimal('destination_lat', 10, 7);
      $table->decimal('destination_lng', 10, 7);
      $table->string('pickup_address')->default('Unknown address');
      $table->string('destination_address')->default('Unknown address');
      $table->decimal('price', 10, 2)->nullable();
      $table->enum('status', ['requested', 'accepted', 'in_progress', 'completed', 'cancelled']);
      $table->boolean('is_pool_enabled')->default(false);
      $table->boolean('passenger_accepts_pooling')->default(false);
      $table->text('encoded_route')->nullable();
      $table->boolean('is_pool_ride')->default(false);
      $table->foreignId('parent_ride_id')->nullable()->constrained('rides')->onDelete('set null');
      $table->foreignId('pool_partner_ride_id')->nullable()->constrained('rides')->onDelete('set null');
      $table->timestamp('requested_at')->nullable();
      $table->timestamp('started_at')->nullable();
      $table->timestamp('completed_at')->nullable();
      $table->timestamp('cancelled_at')->nullable();
      $table->boolean('cash_payment')->default(true);
      $table->boolean('prepaid')->default(false);
      $table->boolean('is_straight_hail')->default(false);
      $table->json('rejected_driver_ids')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('rides');
    Schema::dropIfExists('company_group_ride_instances');
  }
};
