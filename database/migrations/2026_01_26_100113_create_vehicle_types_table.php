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
        Schema::create('vehicle_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., economy, comfort, luxury
            $table->string('display_name');  // e.g., Economy, Comfort, Luxury
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->integer('capacity')->default(4);
            
            // Pricing Configuration
            $table->decimal('base_fare', 10, 2)->default(0.00);
            $table->decimal('price_per_km', 10, 2)->default(0.00);
            $table->decimal('price_per_minute', 10, 2)->default(0.00);
            $table->decimal('minimum_fare', 10, 2)->default(0.00);
            $table->decimal('waiting_fee_per_minute', 10, 2)->default(0.00);
            
            // Commission and Fees
            $table->decimal('commission_percentage', 5, 2)->default(15.00); // e.g., 15.00 for 15%
            $table->decimal('wallet_transaction_percentage', 5, 2)->default(0.00); // Extra fee for wallet usage?
            $table->decimal('wallet_transaction_fixed_fee', 10, 2)->default(0.00);
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_types');
    }
};
