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
        Schema::create('promotion_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('code')->unique()->nullable();
            $table->enum('discount_type', ['percent', 'fixed', 'flat_fare'])->default('percent');
            $table->decimal('discount_value', 12, 2);
            $table->decimal('max_discount_amount', 12, 2)->nullable();
            $table->decimal('min_trip_amount', 12, 2)->default(0);
            $table->json('targeting_rules')->nullable(); // Target user segments, geo-fences, etc.
            $table->decimal('total_budget', 15, 2)->nullable();
            $table->decimal('current_spend', 15, 2)->default(0);
            $table->integer('usage_limit_per_user')->default(1);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotion_campaigns');
    }
};
