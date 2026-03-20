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
        Schema::table('company_driver_contracts', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
            $table->dropColumn('fixed_salary');
            
            $table->string('version')->default('1.0')->after('driver_id');
            $table->timestamp('agreed_at')->nullable()->after('version');
        });

        Schema::rename('company_driver_contracts', 'driver_agreements');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('driver_agreements', 'company_driver_contracts');

        Schema::table('company_driver_contracts', function (Blueprint $table) {
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->decimal('fixed_salary', 10, 2)->nullable();
            
            $table->dropColumn(['version', 'agreed_at']);
        });
    }
};
