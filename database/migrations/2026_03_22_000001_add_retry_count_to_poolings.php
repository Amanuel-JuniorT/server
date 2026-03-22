<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('poolings', function (Blueprint $table) {
            // Tracks which attempt number created this pooling record (1 = first try)
            $table->unsignedTinyInteger('retry_count')->default(0)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('poolings', function (Blueprint $table) {
            $table->dropColumn('retry_count');
        });
    }
};
