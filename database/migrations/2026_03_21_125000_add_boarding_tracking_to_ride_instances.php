<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_group_ride_instances', function (Blueprint $table) {
            $table->json('aboard_employees')->nullable()->after('opted_out_employees');
        });
    }

    public function down(): void
    {
        Schema::table('company_group_ride_instances', function (Blueprint $table) {
            $table->dropColumn('aboard_employees');
        });
    }
};
