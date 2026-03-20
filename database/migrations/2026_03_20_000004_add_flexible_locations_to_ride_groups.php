<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_ride_groups', function (Blueprint $table) {
            $table->string('origin_type')->default('office')->after('group_type');
            $table->string('destination_type')->default('home')->after('origin_type');
        });

        Schema::table('company_ride_group_members', function (Blueprint $table) {
            $table->string('destination_address')->nullable()->after('pickup_lng');
            $table->decimal('destination_lat', 10, 7)->nullable()->after('destination_address');
            $table->decimal('destination_lng', 10, 7)->nullable()->after('destination_lat');
        });
    }

    public function down(): void
    {
        Schema::table('company_ride_group_members', function (Blueprint $table) {
            $table->dropColumn(['destination_address', 'destination_lat', 'destination_lng']);
        });

        Schema::table('company_ride_groups', function (Blueprint $table) {
            $table->dropColumn(['origin_type', 'destination_type']);
        });
    }
};
