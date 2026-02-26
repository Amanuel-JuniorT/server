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
        Schema::create('favorite_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name')->nullable();
            $table->string('address');
            $table->double('latitude');
            $table->double('longitude');
            $table->string('type')->default('favorite'); // 'home', 'work', 'favorite'
            $table->string('label')->nullable();
            $table->boolean('is_active')->default(true);
            $table->bigInteger('timestamp')->nullable(); // Store app-side timestamp
            $table->unique(['user_id', 'address']); // Each user can only have one favorite for a specific address
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorite_locations');
    }
};
