<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class DriverApprovalController extends Controller
{
    public function verify(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'license_number' => 'required|string|max:255',
            'license_image' => 'required|image|max:2048',
            'profile_picture' => 'required|image|max:2048',
            'vehicle_type' => 'required|string',
            'capacity' => 'required|integer|min:1',
            'make' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'plate_number' => 'required|string|unique:vehicles',
            'color' => 'required|string|max:100',
            'year' => 'required|integer|min:1990|max:' . date('Y'),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Upload images
        $licenseImagePath = $request->file('license_image')->store('license_images');
        $profilePicturePath = $request->file('profile_picture')->store('profile_pictures');

        // Save driver info
        $driver = Driver::create([
            'user_id' => $user->id,
            'license_number' => $request->license_number,
            'approval_state' => 'pending',
            'status' => 'offline',
        ]);

        // Save vehicle info
        Vehicle::create([
            'driver_id' => $driver->id,
            'type' => $request->vehicle_type,
            'capacity' => $request->capacity,
            'make' => $request->make,
            'model' => $request->model,
            'plate_number' => $request->plate_number,
            'color' => $request->color,
            'year' => $request->year,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Driver verification submitted',
            'driver_id' => $driver->id,
        ]);
    }
}
