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
        Schema::create('company_package_purchases', function (Blueprint $col) {
            $col->id();
            $col->foreignId('company_id')->constrained()->onDelete('cascade');
            $col->foreignId('package_id')->constrained('ride_packages')->onDelete('cascade');
            $col->integer('rides_purchased');
            $col->integer('rides_remaining');
            $col->decimal('amount_paid', 10, 2);
            $col->enum('status', ['active', 'depleted', 'cancelled'])->default('active');
            $col->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_package_purchases');
    }
};
