<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RidePackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RidePackageController extends Controller
{
    /**
     * Display a listing of ride packages for the admin dashboard.
     */
    public function adminIndex()
    {
        $packages = RidePackage::orderBy('created_at', 'desc')->get();
        return \Inertia\Inertia::render('admin/ride-packages', [
            'packages' => $packages
        ]);
    }

    /**
     * Display a listing of ride packages as JSON.
     */
    public function index()
    {
        $packages = RidePackage::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $packages
        ]);
    }

    /**
     * Store a newly created ride package.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'ride_count' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $package = RidePackage::create($request->all());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Ride package created successfully',
                'data' => $package
            ], 201);
        }

        return redirect()->back()->with('success', 'Ride package created successfully');
    }

    /**
     * Display the specified ride package.
     */
    public function show(RidePackage $package)
    {
        return response()->json([
            'success' => true,
            'data' => $package
        ]);
    }

    /**
     * Update the specified ride package.
     */
    public function update(Request $request, RidePackage $package)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'ride_count' => 'sometimes|required|integer|min:1',
            'price' => 'sometimes|required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $package->update($request->all());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Ride package updated successfully',
                'data' => $package
            ]);
        }

        return redirect()->back()->with('success', 'Ride package updated successfully');
    }

    /**
     * Remove the specified ride package.
     */
    public function destroy(Request $request, RidePackage $package)
    {
        // Optional: Check if it has purchases before deleting
        if ($package->purchases()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete package that has been purchased. Deactivate it instead.'
            ], 400);
        }

        $package->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Ride package deleted successfully'
            ]);
        }

        return redirect()->back()->with('success', 'Ride package deleted successfully');
    }
}
