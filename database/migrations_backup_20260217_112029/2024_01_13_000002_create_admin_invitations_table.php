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
    Schema::create('admin_invitations', function (Blueprint $table) {
      $table->id();
      $table->string('email')->index();
      $table->string('token')->unique();
      $table->string('role')->default('company_admin');
      $table->unsignedBigInteger('company_id')->nullable();
      $table->unsignedBigInteger('invited_by');
      $table->timestamp('expires_at');
      $table->timestamp('accepted_at')->nullable();
      $table->timestamps();

      $table->foreign('invited_by')->references('id')->on('admins')->onDelete('cascade');
      $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('admin_invitations');
  }
};
