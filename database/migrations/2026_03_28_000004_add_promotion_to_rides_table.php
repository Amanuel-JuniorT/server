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
        Schema::table('rides', function (Blueprint $table) {
            $table->foreignId('applied_promotion_id')->nullable()->constrained('promotion_campaigns')->onDelete('set null');
            $table->decimal('original_fare', 12, 2)->nullable();
            $table->decimal('discount_amount', 12, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            $table->dropForeign(['applied_promotion_id']);
            $table->dropColumn(['applied_promotion_id', 'original_fare', 'discount_amount']);
        });
    }
};
