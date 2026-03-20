<?php

namespace App\Http\Controllers;

use App\Models\CompanyEmployee;
use App\Models\Company;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminCompanyController extends Controller
{
  /**
   * Get all company employees (Admin only)
   */
  public function getEmployees(Request $request)
  {
    try {
      $employees = CompanyEmployee::with(['user', 'company'])
        ->orderBy('created_at', 'desc')
        ->get();

      return response()->json([
        'success' => true,
        'data' => [
          'employees' => $employees->map(function ($employee) {
            return [
              'id' => $employee->id,
              'user' => [
                'id' => $employee->user->id,
                'name' => $employee->user->name,
                'email' => $employee->user->email,
                'phone' => $employee->user->phone
              ],
              'company' => [
                'id' => $employee->company->id,
                'name' => $employee->company->name
              ],
              'status' => $employee->status,
              'requested_at' => $employee->requested_at,
              'approved_at' => $employee->approved_at
            ];
          })
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch company employees',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Approve employee request
   */
  public function approveEmployee(Request $request, $id)
  {
    try {
      $employee = CompanyEmployee::findOrFail($id);

      if ($employee->status !== 'pending') {
        return response()->json([
          'success' => false,
          'message' => 'Employee request is not pending'
        ], 400);
      }

      $employee->update([
        'status' => 'approved',
        'approved_at' => now(),
        'approved_by' => $request->user()->id // Assuming admin user ID
      ]);

      // Update user record
      $employee->user->update([
        'is_employee' => true,
        'company_id' => $employee->company_id,
        'company_name' => $employee->company->name
      ]);

      AuditService::high('Employee Approved', $employee, "Approved employee {$employee->user->name} for {$employee->company->name}");

      return response()->json([
        'success' => true,
        'data' => [
          'employee' => [
            'id' => $employee->id,
            'status' => $employee->status,
            'approved_at' => $employee->approved_at
          ]
        ],
        'message' => 'Employee request approved'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to approve employee request',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Reject employee request
   */
  public function rejectEmployee(Request $request, $id)
  {
    $validator = Validator::make($request->all(), [
      'rejection_reason' => 'nullable|string'
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'message' => 'Validation failed',
        'errors' => $validator->errors()
      ], 422);
    }

    try {
      $employee = CompanyEmployee::findOrFail($id);

      if ($employee->status !== 'pending') {
        return response()->json([
          'success' => false,
          'message' => 'Employee request is not pending'
        ], 400);
      }

      $employee->update([
        'status' => 'rejected',
        'rejected_at' => now(),
        'rejection_reason' => $request->rejection_reason
      ]);

      AuditService::high('Employee Rejected', $employee, "Rejected employee {$employee->user->name} for {$employee->company->name}. Reason: " . ($request->rejection_reason ?? 'No reason provided'));

      return response()->json([
        'success' => true,
        'data' => [
          'employee' => [
            'id' => $employee->id,
            'status' => $employee->status,
            'rejected_at' => $employee->rejected_at,
            'rejection_reason' => $employee->rejection_reason
          ]
        ],
        'message' => 'Employee request rejected'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to reject employee request',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get company statistics
   */
  public function getCompanyStats(Request $request)
  {
    try {
      $stats = [
        'total_companies' => Company::count(),
        'active_companies' => Company::where('is_active', true)->count(),
        'total_employees' => CompanyEmployee::where('status', 'approved')->count(),
        'pending_requests' => CompanyEmployee::where('status', 'pending')->count(),
        'rejected_requests' => CompanyEmployee::where('status', 'rejected')->count(),
        'left_employees' => CompanyEmployee::where('status', 'left')->count(),
      ];

      return response()->json([
        'success' => true,
        'data' => [
          'stats' => $stats
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch company statistics',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get pending employee requests only
   */
  public function getPendingEmployees(Request $request)
  {
    try {
      $employees = CompanyEmployee::with(['user', 'company'])
        ->where('status', 'pending')
        ->orderBy('requested_at', 'asc')
        ->get();

      return response()->json([
        'success' => true,
        'data' => [
          'employees' => $employees->map(function ($employee) {
            return [
              'id' => $employee->id,
              'user' => [
                'id' => $employee->user->id,
                'name' => $employee->user->name,
                'email' => $employee->user->email,
                'phone' => $employee->user->phone
              ],
              'company' => [
                'id' => $employee->company->id,
                'name' => $employee->company->name,
                'code' => $employee->company->code
              ],
              'status' => $employee->status,
              'requested_at' => $employee->requested_at
            ];
          })
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch pending employees',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get employee request details
   */
  public function getEmployeeRequest(Request $request, $id)
  {
    try {
      $employee = CompanyEmployee::with(['user', 'company', 'approver'])
        ->findOrFail($id);

      return response()->json([
        'success' => true,
        'data' => [
          'employee' => [
            'id' => $employee->id,
            'user' => [
              'id' => $employee->user->id,
              'name' => $employee->user->name,
              'email' => $employee->user->email,
              'phone' => $employee->user->phone,
              'created_at' => $employee->user->created_at
            ],
            'company' => [
              'id' => $employee->company->id,
              'name' => $employee->company->name,
              'code' => $employee->company->code,
              'email' => $employee->company->email,
              'phone' => $employee->company->phone
            ],
            'status' => $employee->status,
            'requested_at' => $employee->requested_at,
            'approved_at' => $employee->approved_at,
            'rejected_at' => $employee->rejected_at,
            'left_at' => $employee->left_at,
            'rejection_reason' => $employee->rejection_reason,
            'approver' => $employee->approver ? [
              'id' => $employee->approver->id,
              'name' => $employee->approver->name
            ] : null
          ]
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch employee request',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Update company billing settings (Postpaid/Prepaid/Credit Limit)
   */
  public function updateBilling(Request $request, $id)
  {
    $validator = Validator::make($request->all(), [
      'billing_type' => 'required|in:prepaid,weekly_postpaid,monthly_postpaid',
      'credit_limit' => 'required|numeric|min:0'
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'message' => 'Validation failed',
        'errors' => $validator->errors()
      ], 422);
    }

    try {
      $company = Company::findOrFail($id);
      
      $company->update([
        'billing_type' => $request->billing_type,
        'credit_limit' => $request->credit_limit
      ]);

      AuditService::high('Billing Updated', $company, "Updated billing for {$company->name} to {$request->billing_type} with limit {$request->credit_limit}");

      return response()->json([
        'success' => true,
        'data' => [
          'company_id' => $company->id,
          'billing_type' => $company->billing_type,
          'credit_limit' => $company->credit_limit
        ],
        'message' => 'Billing settings updated successfully'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to update billing settings',
        'error' => $e->getMessage()
      ], 500);
    }
  }
}
