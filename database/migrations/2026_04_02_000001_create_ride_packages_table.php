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
        Schema::create('ride_packages', function (Blueprint $col) {
            $col->id();
            $col->string('name');
            $col->integer('ride_count');
            $col->decimal('price', 10, 2);
            $col->text('description')->nullable();
            $col->boolean('is_active')->default(true);
            $col->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ride_packages');
    }
};
