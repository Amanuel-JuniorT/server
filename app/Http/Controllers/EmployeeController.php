<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyEmployee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    /**
     * Request to link to a company
     */
    public function linkCompany(Request $request)
    {
        // Normalize code to uppercase for case-insensitive check
        if ($request->has('code')) {
            $request->merge(['code' => strtoupper($request->code)]);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|exists:companies,code',
            'home_address' => 'required|string',
            'home_lat' => 'required|numeric',
            'home_lng' => 'required|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            $company = Company::where('code', strtoupper($request->code))->first();

            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            // Check if user has an active approved relationship with any company
            $activeEmployee = CompanyEmployee::where('user_id', $user->id)
                ->where('status', 'approved')
                ->orderBy('created_at', 'desc')
                ->first();

            if ($activeEmployee) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already linked to a company'
                ], 409);
            }

            DB::beginTransaction();

            // Check if user has an existing record with this company
            $existingRecord = CompanyEmployee::where('company_id', $company->id)
                ->where('user_id', $user->id)
                ->first();

            // Check if user has a pending request for this specific company
            if ($existingRecord && $existingRecord->status === 'pending') {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending request for this company'
                ], 409);
            }

            // Check if user has a pending request for another company
            $pendingForOtherCompany = CompanyEmployee::where('user_id', $user->id)
                ->where('company_id', '!=', $company->id)
                ->where('status', 'pending')
                ->first();

            if ($pendingForOtherCompany) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending request for another company. Please cancel it first.'
                ], 409);
            }

            if ($existingRecord) {
                // User has a previous relationship with this company
                if ($existingRecord->status === 'left' || $existingRecord->status === 'rejected') {
                    // Update existing record to create a new request
                    $existingRecord->update([
                        'status' => 'pending',
                        'requested_at' => now(),
                        'approved_at' => null,
                        'rejected_at' => null,
                        'left_at' => null,
                        'rejection_reason' => null,
                        'approved_by' => null,
                        'home_address' => $request->home_address,
                        'home_lat' => $request->home_lat,
                        'home_lng' => $request->home_lng
                    ]);
                    $companyEmployee = $existingRecord;
                } else {
                    // This shouldn't happen due to previous checks, but just in case
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Unexpected error: existing record found with status: ' . $existingRecord->status
                    ], 500);
                }
            } else {
                // Create new company employee record
                $companyEmployee = CompanyEmployee::create([
                    'company_id' => $company->id,
                    'user_id' => $user->id,
                    'status' => 'pending',
                    'requested_at' => now(),
                    'home_address' => $request->home_address,
                    'home_lat' => $request->home_lat,
                    'home_lng' => $request->home_lng
                ]);
            }

            // Keep status as pending - requires admin approval
            // Don't update user record until approved

            DB::commit();

            $isReRequest = $existingRecord !== null;

            return response()->json([
                'success' => true,
                'status' => 'pending',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'is_employee' => false,
                        'company_id' => $company->id,
                        'company_name' => $company->name
                    ]
                ],
                'message' => $isReRequest ? 'Company linking request submitted for approval' : 'Company linking request submitted for approval'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to link to company',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get employee's company information
     */
    public function getCompanyInfo(Request $request)
    {
        try {
            $user = $request->user();

            // Get the most recent company employee relationship
            $companyEmployee = CompanyEmployee::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$companyEmployee) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'state' => 'none',
                        'company' => null,
                        'requested_at' => null,
                        'approved_at' => null
                    ]
                ]);
            }

            $state = match ($companyEmployee->status) {
                'pending' => 'pending',
                'approved' => 'linked',
                'rejected' => 'rejected',
                'left' => 'left',
                default => 'none'
            };

            return response()->json([
                'success' => true,
                'data' => [
                    'state' => $state,
                    'company' => $companyEmployee->status === 'approved' ? [
                        'id' => $companyEmployee->company->id,
                        'name' => $companyEmployee->company->name,
                        'code' => $companyEmployee->company->code
                    ] : null,
                    'home_address' => $companyEmployee->home_address,
                    'home_lat' => $companyEmployee->home_lat,
                    'home_lng' => $companyEmployee->home_lng,
                    'rejection_reason' => $state === 'rejected' ? $companyEmployee->rejection_reason : null,
                    'requested_at' => $companyEmployee->requested_at,
                    'approved_at' => $companyEmployee->approved_at
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get company information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Leave current company
     */
    public function leaveCompany(Request $request)
    {
        try {
            $user = $request->user();

            // Get the most recent approved company employee relationship
            $companyEmployee = CompanyEmployee::where('user_id', $user->id)
                ->where('status', 'approved')
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$companyEmployee) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not linked to any company'
                ], 404);
            }

            DB::beginTransaction();

            // Update company employee status
            $companyEmployee->update([
                'status' => 'left',
                'left_at' => now()
            ]);

            // Update user record
            $user->update([
                'is_employee' => false,
                'company_id' => null,
                'company_name' => null
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'state' => 'none'
                ],
                'message' => 'Successfully left company'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to leave company',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel pending link request
     */
    public function cancelLinkRequest(Request $request)
    {
        try {
            $user = $request->user();

            // Get the most recent pending company employee relationship
            $companyEmployee = CompanyEmployee::where('user_id', $user->id)
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$companyEmployee) {
                return response()->json([
                    'success' => false,
                    'message' => 'No pending request found'
                ], 404);
            }

            $companyEmployee->delete();

            return response()->json([
                'success' => true,
                'data' => [
                    'state' => 'none'
                ],
                'message' => 'Link request cancelled'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel link request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
