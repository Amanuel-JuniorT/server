<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyPackagePurchase;
use App\Models\RidePackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompanyPackageController extends Controller
{
    /**
     * List available ride packages for companies.
     */
    public function index()
    {
        $packages = RidePackage::where('is_active', true)->orderBy('price', 'asc')->get();
        return response()->json([
            'success' => true,
            'data' => $packages
        ]);
    }

    /**
     * Purchase a ride package.
     */
    public function purchase(Request $request, $companyId)
    {
        $request->validate([
            'package_id' => 'required|exists:ride_packages,id',
        ]);

        try {
            DB::beginTransaction();

            $company = Company::findOrFail($companyId);
            $package = RidePackage::findOrFail($request->package_id);

            if (!$package->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package is not currently available for purchase.'
                ], 400);
            }

            // Create purchase record
            $purchase = CompanyPackagePurchase::create([
                'company_id' => $company->id,
                'package_id' => $package->id,
                'rides_purchased' => $package->ride_count,
                'rides_remaining' => $package->ride_count,
                'amount_paid' => $package->price,
                'status' => 'active',
            ]);

            // Update company total balance
            $company->increment('total_remaining_rides', $package->ride_count);

            // Record transaction in wallet history (optional, if we want to show it there)
            // But packages might be paid via offline receipt first. 
            // For now, we assume this is called after payment is verified.

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Package purchased successfully',
                'data' => [
                    'purchase' => $purchase,
                    'new_balance' => $company->total_remaining_rides
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to purchase ride package', [
                'company_id' => $companyId,
                'package_id' => $request->package_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process purchase: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get purchase history for a company.
     */
    public function history($companyId)
    {
        $history = CompanyPackagePurchase::with('package')
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }
}
