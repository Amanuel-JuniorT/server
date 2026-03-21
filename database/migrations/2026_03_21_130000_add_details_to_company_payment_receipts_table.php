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
        Schema::table('company_payment_receipts', function (Blueprint $table) {
            $table->date('contract_period_start')->nullable()->after('company_id');
            $table->date('contract_period_end')->nullable()->after('contract_period_start');
            $table->string('receipt_image_url')->nullable()->after('contract_period_end');
            $table->timestamp('submitted_at')->nullable()->after('status');
            $table->timestamp('verified_at')->nullable()->after('submitted_at');
            $table->foreignId('verified_by')->nullable()->constrained('users')->after('verified_at');
            $table->text('rejection_reason')->nullable()->after('verified_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_payment_receipts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn([
                'contract_period_start',
                'contract_period_end',
                'receipt_image_url',
                'submitted_at',
                'verified_at',
                'rejection_reason'
            ]);
        });
    }
};
