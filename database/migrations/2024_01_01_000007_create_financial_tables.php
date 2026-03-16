<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('wallets', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
      $table->decimal('balance', 12, 2)->default(0);
      $table->timestamps();
    });

    Schema::create('transactions', function (Blueprint $table) {
      $table->id();
      $table->foreignId('wallet_id')->constrained('wallets')->onDelete('cascade');
      $table->decimal('amount', 10, 2);
      $table->enum('type', ['topup', 'withdraw', 'transfer', 'payment']);
      $table->text('note')->nullable();
      $table->string('receipt_path')->nullable();
      $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
      $table->timestamps();
    });

    Schema::create('payments', function (Blueprint $table) {
      $table->id();
      $table->foreignId('ride_id')->constrained('rides');
      $table->decimal('amount', 10, 2);
      $table->enum('method', ['wallet', 'cash', 'card', 'mobile_money']);
      $table->enum('status', ['pending', 'paid', 'failed']);
      $table->timestamp('paid_at')->nullable();
      $table->timestamps();
    });

    Schema::create('company_payment_receipts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
      $table->decimal('amount', 10, 2);
      $table->string('receipt_path');
      $table->text('note')->nullable();
      $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('company_payment_receipts');
    Schema::dropIfExists('payments');
    Schema::dropIfExists('transactions');
    Schema::dropIfExists('wallets');
  }
};
