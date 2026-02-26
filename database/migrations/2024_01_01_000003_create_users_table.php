<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('users', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('email')->nullable();
      $table->boolean('default_pool_preference')->default(false);
      $table->string('phone');
      $table->string('password');
      $table->enum('role', ['passenger', 'driver']);
      $table->boolean('is_active')->default(true);
      $table->boolean('is_employee')->default(false);
      $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('set null');
      $table->string('company_name')->nullable();
      $table->string('profile_image')->nullable();
      $table->timestamps();
    });

    Schema::create('admins', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('email')->unique();
      $table->string('password');
      $table->rememberToken();
      $table->enum('role', ['super_admin', 'company_admin'])->default('super_admin');
      $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('set null');
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('users');
    Schema::dropIfExists('admins');
  }
};
