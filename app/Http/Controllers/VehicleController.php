<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Storage;

class VehicleController extends Controller
{
    

public function store(Request $request)
{
    $validated = $request->validate([
        'driver_id' => 'required|exists:drivers,id',
        'vehicle_type' => 'required|string',
        'capacity' => 'required|integer',
        'make' => 'required|string',
        'model' => 'required|string',
        'plate_number' => 'required|string|unique:vehicles,plate_number',
        'color' => 'required|string',
        'year' => 'required|integer',
        'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048', // 👈 validation for image
    ]);

    // Store image if exists
    if ($request->hasFile('image')) {
        $validated['image'] = $request->file('image')->store('vehicles', 'public');
    }

    $vehicle = Vehicle::create($validated);

    return response()->json([
        'message' => 'Vehicle created successfully',
        'vehicle' => $vehicle
    ], 201);
}


}
