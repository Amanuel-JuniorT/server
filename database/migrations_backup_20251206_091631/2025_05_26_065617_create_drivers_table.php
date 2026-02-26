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
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('license_number');
            $table->enum('status', ['available', 'on_ride', 'offline'])->default('offline');
            $table->enum('approval_state', ['pending', 'approved', 'rejected' ])->default('pending');
            $table->string('reject_message')->nullable();

            $licenseImagePath = 'license_images/default.png'; // Default path if not provided
            $profilePicturePath = 'profile_pictures/default.png'; // Default path if not provided
            // Store the paths for license and profile pictures
            $table->string('license_image_path')->default($licenseImagePath);
            $table->string('profile_picture_path')->default($profilePicturePath);
            

            $table->decimal('rating', 3, 2)->default(5.00);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
