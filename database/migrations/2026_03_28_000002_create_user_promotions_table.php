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
        Schema::create('user_promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('promotion_campaign_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['available', 'applied', 'used', 'expired'])->default('available');
            $table->integer('rides_remaining')->default(1);
            $table->timestamp('used_at')->nullable();
            $table->foreignId('ride_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_promotions');
    }
};
