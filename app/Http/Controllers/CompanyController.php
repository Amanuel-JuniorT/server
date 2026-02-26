<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
  /**
   * Register a new company
   */
  public function register(Request $request)
  {
    $validator = Validator::make($request->all(), [
      'name' => 'required|string|max:255',
      'code' => 'nullable|string|max:10|unique:companies,code',
      'description' => 'nullable|string',
      'address' => 'nullable|string',
      'phone' => 'nullable|string|max:20',
      'email' => 'nullable|email|max:255',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'message' => 'Validation failed',
        'errors' => $validator->errors()
      ], 422);
    }

    try {
      $companyData = $request->only([
        'name',
        'description',
        'address',
        'phone',
        'email'
      ]);

      // Generate unique code if not provided
      if (!$request->has('code') || empty($request->code)) {
        $companyData['code'] = Company::generateCode();
      } else {
        $companyData['code'] = strtoupper($request->code);
      }

      $company = Company::create($companyData);

      return response()->json([
        'success' => true,
        'data' => [
          'company' => $company
        ],
        'message' => 'Company registered successfully'
      ], 201);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to register company',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * List all companies (Admin only)
   */
  public function list()
  {
    try {
      $companies = Company::withCount(['employees' => function ($query) {
        $query->where('status', 'approved');
      }])->get();

      return response()->json([
        'success' => true,
        'data' => [
          'companies' => $companies
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch companies',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Show company details
   */
  public function show($id)
  {
    try {
      $company = Company::withCount(['employees' => function ($query) {
        $query->where('status', 'approved');
      }])->findOrFail($id);

      return response()->json([
        'success' => true,
        'data' => [
          'company' => $company
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Company not found',
        'error' => $e->getMessage()
      ], 404);
    }
  }

  /**
   * Update company information
   */
  public function update(Request $request, $id)
  {
    $validator = Validator::make($request->all(), [
      'name' => 'sometimes|string|max:255',
      'description' => 'nullable|string',
      'address' => 'nullable|string',
      'phone' => 'nullable|string|max:20',
      'email' => 'nullable|email|max:255',
      'is_active' => 'sometimes|boolean',
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
      $company->update($request->only([
        'name',
        'description',
        'address',
        'phone',
        'email',
        'is_active'
      ]));

      return response()->json([
        'success' => true,
        'data' => [
          'company' => $company
        ],
        'message' => 'Company updated successfully'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to update company',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Get available active companies for drivers
   */
  public function getAvailableCompanies()
  {
    try {
      $companies = Company::where('is_active', true)
        ->select(['id', 'name', 'description', 'address', 'phone', 'email', 'code'])
        ->get();

      return response()->json([
        'success' => true,
        'data' => [
          'companies' => $companies
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch available companies',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Delete company (Admin only)
   */
  public function delete($id)
  {
    try {
      $company = Company::findOrFail($id);
      $company->delete();

      return response()->json([
        'success' => true,
        'message' => 'Company deleted successfully'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to delete company',
        'error' => $e->getMessage()
      ], 500);
    }
  }
}
