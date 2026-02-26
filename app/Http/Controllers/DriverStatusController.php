<?php
namespace App\Http\Controllers;
// In DriverStatusController.php
use Illuminate\Http\Request;
use App\Models\Driver;
use App\Http\Controllers\Controller;
class DriverStatusController extends Controller
{
    /**
     * Update the driver's status.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */

public function updateStatus(Request $request)
{
    $driver = $request->user()->driver;

    if (!$driver) {
        return response()->json(['message' => 'Driver not found'], 404);
    }

    $validated = $request->validate([
        'status' => 'required|in:available,offline',
    ]);

    $driver->status = $validated['status'];
    $driver->save();

    return response()->json(['message' => 'Status updated']);
    
}
}
    