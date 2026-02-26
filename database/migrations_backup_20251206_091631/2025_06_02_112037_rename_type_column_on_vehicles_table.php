<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->renameColumn('type', 'vehicle_type');
        });
    }

    public function down()
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->renameColumn('vehicle_type', 'type');
        });
    }
};
