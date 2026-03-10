<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('company_employees', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
      $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
      $table->text('home_address')->nullable();
      $table->decimal('home_lat', 10, 7)->nullable();
      $table->decimal('home_lng', 10, 7)->nullable();
      $table->enum('status', ['pending', 'approved', 'rejected', 'left'])->default('pending');
      $table->timestamp('requested_at')->nullable();
      $table->timestamp('approved_at')->nullable();
      $table->timestamp('rejected_at')->nullable();
      $table->timestamp('left_at')->nullable();
      $table->foreignId('approved_by')->nullable()->constrained('admins')->onDelete('set null');
      $table->text('rejection_reason')->nullable();
      $table->timestamps();
    });

    Schema::create('company_ride_groups', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
      $table->string('group_name');
      $table->enum('group_type', ['to_office', 'from_office']);
      $table->string('pickup_address')->nullable();
      $table->decimal('pickup_lat', 10, 7)->nullable();
      $table->decimal('pickup_lng', 10, 7)->nullable();
      $table->string('destination_address')->nullable();
      $table->decimal('destination_lat', 10, 7)->nullable();
      $table->decimal('destination_lng', 10, 7)->nullable();
      $table->time('scheduled_time');
      $table->integer('max_capacity')->default(4);
      $table->date('start_date')->nullable();
      $table->date('end_date')->nullable();
      $table->enum('status', ['active', 'inactive'])->default('active');
      $table->timestamps();
    });

    Schema::create('company_ride_group_members', function (Blueprint $table) {
      $table->id();
      $table->foreignId('ride_group_id')->constrained('company_ride_groups')->onDelete('cascade');
      $table->foreignId('employee_id')->constrained('users')->onDelete('cascade');
      $table->string('pickup_address')->nullable();
      $table->decimal('pickup_lat', 10, 7)->nullable();
      $table->decimal('pickup_lng', 10, 7)->nullable();
      $table->timestamps();
    });

    Schema::create('company_ride_group_assignments', function (Blueprint $table) {
      $table->id();
      $table->foreignId('ride_group_id')->constrained('company_ride_groups')->onDelete('cascade');
      $table->foreignId('driver_id')->nullable()->constrained('drivers')->onDelete('cascade');
      $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
      $table->date('start_date');
      $table->date('end_date');
      $table->json('days_of_week');
      $table->enum('status', ['pending', 'accepted', 'active', 'completed', 'cancelled'])->default('pending');
      $table->timestamp('accepted_at')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('company_ride_group_assignments');
    Schema::dropIfExists('company_ride_group_members');
    Schema::dropIfExists('company_ride_groups');
    Schema::dropIfExists('company_employees');
  }
};
