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
        Schema::table('wallets', function (Blueprint $table) {
            // Make user_id nullable first
            $table->foreignId('user_id')->nullable()->change();
            
            // Add company_id for corporate wallets
            $table->foreignId('company_id')->nullable()->after('user_id')->unique()->constrained('companies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn('company_id');
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
