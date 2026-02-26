<?php

namespace App\Http\Controllers;

use App\Models\VehicleType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class VehicleTypeController extends Controller
{
  public function index()
  {
    $vehicleTypes = VehicleType::all();
    return Inertia::render('admin/vehicle-types', [
      'vehicleTypes' => $vehicleTypes
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255|unique:vehicle_types,name',
      'display_name' => 'required|string|max:255',
      'description' => 'nullable|string',
      'capacity' => 'required|integer|min:1',
      'base_fare' => 'required|numeric|min:0',
      'price_per_km' => 'required|numeric|min:0',
      'price_per_minute' => 'required|numeric|min:0',
      'minimum_fare' => 'required|numeric|min:0',
      'waiting_fee_per_minute' => 'required|numeric|min:0',
      'commission_percentage' => 'required|numeric|min:0|max:100',
      'wallet_transaction_percentage' => 'required|numeric|min:0|max:100',
      'wallet_transaction_fixed_fee' => 'required|numeric|min:0',
      'is_active' => 'required|boolean',
      'image' => 'nullable|image|max:2048',
    ]);

    if ($request->hasFile('image')) {
      $path = $request->file('image')->store('vehicle_types', 'public');
      $validated['image_path'] = $path;
    }

    VehicleType::create($validated);

    return redirect()->back()->with('success', 'Vehicle type created successfully.');
  }

  public function update(Request $request, $id)
  {
    $vehicleType = VehicleType::findOrFail($id);

    $validated = $request->validate([
      'name' => 'required|string|max:255|unique:vehicle_types,name,' . $id,
      'display_name' => 'required|string|max:255',
      'description' => 'nullable|string',
      'capacity' => 'required|integer|min:1',
      'base_fare' => 'required|numeric|min:0',
      'price_per_km' => 'required|numeric|min:0',
      'price_per_minute' => 'required|numeric|min:0',
      'minimum_fare' => 'required|numeric|min:0',
      'waiting_fee_per_minute' => 'required|numeric|min:0',
      'commission_percentage' => 'required|numeric|min:0|max:100',
      'wallet_transaction_percentage' => 'required|numeric|min:0|max:100',
      'wallet_transaction_fixed_fee' => 'required|numeric|min:0',
      'is_active' => 'required|boolean',
      'image' => 'nullable|image|max:2048',
    ]);

    if ($request->hasFile('image')) {
      // Delete old image if exists
      if ($vehicleType->image_path) {
        Storage::disk('public')->delete($vehicleType->image_path);
      }
      $path = $request->file('image')->store('vehicle_types', 'public');
      $validated['image_path'] = $path;
    }

    $vehicleType->update($validated);

    return redirect()->back()->with('success', 'Vehicle type updated successfully.');
  }

  public function destroy($id)
  {
    $vehicleType = VehicleType::findOrFail($id);

    // Check if there are vehicles of this type
    if ($vehicleType->vehicles()->count() > 0) {
      return redirect()->back()->with('error', 'Cannot delete vehicle type because it is associated with existing vehicles.');
    }

    if ($vehicleType->image_path) {
      Storage::disk('public')->delete($vehicleType->image_path);
    }

    $vehicleType->delete();

    return redirect()->back()->with('success', 'Vehicle type deleted successfully.');
  }

  public function toggleStatus($id)
  {
    $vehicleType = VehicleType::findOrFail($id);
    $vehicleType->is_active = !$vehicleType->is_active;
    $vehicleType->save();

    return redirect()->back()->with('success', 'Vehicle type status updated.');
  }
}
