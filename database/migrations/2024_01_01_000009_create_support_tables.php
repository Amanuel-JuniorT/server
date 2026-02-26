<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('locations', function (Blueprint $table) {
      $table->id();
      $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');
      $table->decimal('latitude', 10, 8);
      $table->decimal('longitude', 11, 8);
      $table->timestamps();
    });

    Schema::create('ratings', function (Blueprint $table) {
      $table->id();
      $table->foreignId('ride_id')->constrained('rides');
      $table->foreignId('from_user_id')->constrained('users');
      $table->foreignId('to_user_id')->constrained('users');
      $table->tinyInteger('score');
      $table->text('comment')->nullable();
      $table->timestamps();
    });

    Schema::create('device_tokens', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
      $table->string('platform', 20)->index();
      $table->string('app', 20)->index();
      $table->string('token')->unique();
      $table->timestamp('last_seen_at')->nullable();
      $table->timestamps();
    });

    Schema::create('documents', function (Blueprint $table) {
      $table->id();
      $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');
      $table->enum('document_type', ['driver_license', 'vehicle_registration', 'insurance', 'inspection', 'profile_picture']);
      $table->string('file_path');
      $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
      $table->timestamp('uploaded_at')->nullable();
      $table->timestamp('reviewed_at')->nullable();
      $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
      $table->text('rejection_reason')->nullable();
      $table->timestamps();
    });

    Schema::create('promotions', function (Blueprint $table) {
      $table->id();
      $table->string('code')->unique();
      $table->enum('type', ['percentage', 'fixed']);
      $table->decimal('value', 10, 2);
      $table->date('expires_at');
      $table->integer('usage_limit')->nullable();
      $table->integer('used_count')->default(0);
      $table->timestamps();
    });

    Schema::create('company_driver_contracts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
      $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');
      $table->date('start_date');
      $table->date('end_date')->nullable();
      $table->decimal('fixed_salary', 10, 2)->nullable();
      $table->enum('status', ['active', 'expired', 'terminated'])->default('active');
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('company_driver_contracts');
    Schema::dropIfExists('promotions');
    Schema::dropIfExists('documents');
    Schema::dropIfExists('device_tokens');
    Schema::dropIfExists('ratings');
    Schema::dropIfExists('locations');
  }
};
