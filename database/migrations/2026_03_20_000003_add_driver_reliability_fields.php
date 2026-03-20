<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->decimal('reliability_score', 5, 2)->default(100.00);
            $table->integer('no_show_count')->default(0);
            $table->string('corporate_agreed_version')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['reliability_score', 'no_show_count', 'corporate_agreed_version']);
        });
    }
};
