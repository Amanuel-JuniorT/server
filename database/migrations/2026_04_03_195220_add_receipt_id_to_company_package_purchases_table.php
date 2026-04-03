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
        Schema::table('company_package_purchases', function (Blueprint $table) {
            $table->foreignId('company_payment_receipt_id')->nullable()->after('package_id')
                ->constrained('company_payment_receipts')->onDelete('set null');
            
            // To update enum statuses in Laravel successfully across different DBs, we often use a raw statement
            $table->string('status')->default('pending_payment')->change();
        });
        
        // Ensure existing active ones stay active if any, but this is a new feature so it's fine.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_package_purchases', function (Blueprint $table) {
            $table->dropForeign(['company_payment_receipt_id']);
            $table->dropColumn('company_payment_receipt_id');
            $table->string('status')->default('active')->change();
        });
    }
};
