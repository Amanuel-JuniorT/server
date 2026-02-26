<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyDriverContract;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CompanyDriverContractController extends Controller
{
    /**
     * Driver registers a contract request with a company
     */
    public function store(Request $request, $companyId)
    {
        try {
            $user = Auth::user();
            $driver = $user->driver;

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a driver'
                ], 403);
            }

            $company = Company::findOrFail($companyId);

            $validator = Validator::make($request->all(), [
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'nullable|date|after:start_date',
                'terms' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if contract already exists
            $existingContract = CompanyDriverContract::where('company_id', $companyId)
                ->where('driver_id', $driver->id)
                ->first();

            if ($existingContract && $existingContract->status === 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have an active contract with this company'
                ], 409);
            }

            $contract = CompanyDriverContract::create([
                'company_id' => $companyId,
                'driver_id' => $driver->id,
                'status' => 'pending',
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'terms' => $request->terms,
            ]);

            return response()->json([
                'success' => true,
                'data' => $contract,
                'message' => 'Contract request submitted successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create contract request', [
                'company_id' => $companyId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit contract request. Please try again later.'
            ], 500);
        }
    }

    /**
     * List contracts for a company
     */
    public function index($companyId)
    {
        try {
            $user = Auth::user();
            $company = Company::findOrFail($companyId);

            // Check if user is company admin
            if ($user->role !== 'company_admin' || $user->company_id != $companyId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $contracts = CompanyDriverContract::with(['driver.user', 'company'])
                ->where('company_id', $companyId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $contracts
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch company contracts', [
                'company_id' => $companyId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch contracts. Please try again later.'
            ], 500);
        }
    }

    /**
     * Update contract status (approve/reject/cancel)
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $contract = CompanyDriverContract::with('company')->findOrFail($id);

            // Check if user is company admin for this company
            if ($user->role !== 'company_admin' || $user->company_id != $contract->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:active,expired,cancelled',
                'end_date' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $contract->update([
                'status' => $request->status,
                'end_date' => $request->end_date ?? $contract->end_date,
            ]);

            return response()->json([
                'success' => true,
                'data' => $contract,
                'message' => 'Contract updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update contract', [
                'contract_id' => $id,
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update contract. Please try again later.'
            ], 500);
        }
    }

    /**
     * Get driver's contracts
     */
    public function driverContracts()
    {
        try {
            $user = Auth::user();
            $driver = $user->driver;

            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a driver'
                ], 403);
            }

            $contracts = CompanyDriverContract::with(['company'])
                ->where('driver_id', $driver->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $contracts
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch driver contracts', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch contracts. Please try again later.'
            ], 500);
        }
    }

    /**
     * Get active contracts for a company
     */
    public function activeContracts($companyId)
    {
        try {
            $user = Auth::user();
            $company = Company::findOrFail($companyId);

            // Check if user is company admin
            if ($user->role !== 'company_admin' || $user->company_id != $companyId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $contracts = CompanyDriverContract::with(['driver.user', 'driver.location'])
                ->where('company_id', $companyId)
                ->active()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $contracts
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch active contracts', [
                'company_id' => $companyId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active contracts. Please try again later.'
            ], 500);
        }
    }
}
