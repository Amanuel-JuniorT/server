<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('companies', function (Blueprint $table) {
      $table->id();
      $table->string('name')->unique();
      $table->string('code', 10)->unique();
      $table->text('description')->nullable();
      $table->string('email')->nullable();
      $table->string('phone')->nullable();
      $table->text('address')->nullable();
      $table->decimal('default_origin_lat', 10, 7)->nullable();
      $table->decimal('default_origin_lng', 11, 7)->nullable();
      $table->string('contact_person')->nullable();
      $table->boolean('is_active')->default(true);
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('companies');
  }
};
