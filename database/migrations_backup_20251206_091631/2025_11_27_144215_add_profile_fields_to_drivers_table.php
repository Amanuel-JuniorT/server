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
        Schema::table('drivers', function (Blueprint $table) {
            $table->date('license_expiry')->nullable()->after('license_number');
            $table->integer('experience_years')->nullable()->after('license_expiry');
            $table->string('emergency_contact_name')->nullable()->after('experience_years');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['license_expiry', 'experience_years', 'emergency_contact_name', 'emergency_contact_phone']);
        });
    }
};
