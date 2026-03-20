<?php

namespace App\Http\Controllers;

use App\Events\RideScheduled;
use App\Jobs\RetryCompanyRideAssignment;
use App\Models\Company;
use App\Models\CompanyEmployee;
use App\Models\CompanyGroupRideInstance;
use App\Models\Driver;
use App\Models\FavoriteLocation;
use App\Models\User;
use App\Services\CompanyRideAssignmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CompanyAdminController extends Controller
{
    /**
     * Company admin dashboard
     */
    public function dashboard()
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        $stats = [
            'total_employees' => CompanyEmployee::where('company_id', $company->id)->count(),
            'approved_employees' => CompanyEmployee::where('company_id', $company->id)->where('status', 'approved')->count(),
            'pending_requests' => CompanyEmployee::where('company_id', $company->id)->where('status', 'pending')->count(),
            'rejected_requests' => CompanyEmployee::where('company_id', $company->id)->where('status', 'rejected')->count(),
            'total_rides' => CompanyGroupRideInstance::where('company_id', $company->id)->count(),
            'scheduled_rides' => CompanyGroupRideInstance::where('company_id', $company->id)->where('status', 'requested')->count(),
            'completed_rides' => CompanyGroupRideInstance::where('company_id', $company->id)->where('status', 'completed')->count(),
        ];

        return Inertia::render('company-admin/dashboard', [
            'company' => $company,
            'stats' => $stats,
            'billing' => [
                'labels' => [],
                'data' => [],
                'currency' => 'ETB',
            ],
        ]);
    }

    /**
     * List company employees
     */
    public function employees()
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        $employees = CompanyEmployee::with(['user', 'company'])
            ->where('company_id', $company->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_employees' => $employees->count(),
            'approved_employees' => $employees->where('status', 'approved')->count(),
            'pending_requests' => $employees->where('status', 'pending')->count(),
            'rejected_requests' => $employees->where('status', 'rejected')->count(),
        ];

        return Inertia::render('company-admin/employees', [
            'employees' => $employees,
            'company' => $company,
            'stats' => $stats,
        ]);
    }

    /**
     * Approve employee request
     */
    public function approveEmployee($id)
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        try {
            $employee = CompanyEmployee::where('id', $id)
                ->where('company_id', $company->id)
                ->firstOrFail();

            if ($employee->status !== 'pending') {
                return redirect()->back()->with('error', 'Employee request is not pending');
            }

            DB::beginTransaction();

            // Update company employee record
            $employee->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $admin->id
            ]);

            // Update user record to make them an employee
            $employee->user->update([
                'is_employee' => true,
                'company_id' => $employee->company_id,
                'company_name' => $employee->company->name
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Employee request approved successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to approve employee request: ' . $e->getMessage());
        }
    }

    /**
     * Reject employee request
     */
    public function rejectEmployee(Request $request, $id)
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        try {
            $employee = CompanyEmployee::where('id', $id)
                ->where('company_id', $company->id)
                ->firstOrFail();

            if ($employee->status !== 'pending') {
                return redirect()->back()->with('error', 'Employee request is not pending');
            }

            $employee->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejection_reason' => $request->input('rejection_reason')
            ]);

            return redirect()->back()->with('success', 'Employee request rejected successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to reject employee request: ' . $e->getMessage());
        }
    }

    /**
     * Remove employee from company
     */
    public function removeEmployee($id)
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        try {
            $employee = CompanyEmployee::where('id', $id)
                ->where('company_id', $company->id)
                ->with('user')
                ->firstOrFail();

            // Only update the company_employees relationship table
            // Company admins should not modify the users table
            $employee->update([
                'status' => 'left',
                'left_at' => now(),
            ]);

            return redirect()->back()->with('success', 'Employee removed from company successfully!');
        } catch (\Exception $e) {
            Log::error('Failed to remove employee', [
                'error' => $e->getMessage(),
                'employee_id' => $id
            ]);
            return redirect()->back()->with('error', 'Failed to remove employee: ' . $e->getMessage());
        }
    }


    /**
     * View company profile
     */
    public function profile()
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        return Inertia::render('company-admin/profile', [
            'company' => $company,
        ]);
    }

    /**
     * Update company profile
     */
    public function updateProfile(Request $request)
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:companies,name,' . $company->id,
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:companies,email,' . $company->id,
            'default_origin_lat' => 'nullable|numeric',
            'default_origin_lng' => 'nullable|numeric',
        ], [
            'name.unique' => 'A company with this name already exists.',
            'email.unique' => 'A company with this email already exists.',
            'email.email' => 'Please enter a valid email address.',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $company->update($request->only([
                'name',
                'description',
                'address',
                'phone',
                'email',
                'default_origin_lat',
                'default_origin_lng',
            ]));

            return redirect()->back()->with('success', 'Company profile updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update company profile: ' . $e->getMessage());
        }
    }

    /**
     * Add a single employee to the company
     */
    public function addEmployee(Request $request)
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|max:20',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'nullable|string|min:8',
            'home_address' => 'required|string', // Mandatory for production ride tracking
            'home_lat' => 'required|numeric',
            'home_lng' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            // Normalize phone for searching
            $phone = $request->phone;
            $searchPhones = [$phone];
            $cleanPhone = preg_replace('/[^0-9]/', '', $phone);

            if (str_starts_with($cleanPhone, '251')) {
                $searchPhones[] = '0' . substr($cleanPhone, 3);
                $searchPhones[] = '+' . $cleanPhone;
                $searchPhones[] = $cleanPhone;
            } elseif (str_starts_with($cleanPhone, '09') || str_starts_with($cleanPhone, '07')) {
                $searchPhones[] = '251' . substr($cleanPhone, 1);
                $searchPhones[] = '+251' . substr($cleanPhone, 1);
            }

            // Check if user exists by phone number (flexible search)
            $user = User::whereIn('phone', array_unique($searchPhones))->first();

            if ($user) {
                // User exists, check if they're already an employee of this company
                $existingEmployee = CompanyEmployee::where('user_id', $user->id)
                    ->where('company_id', $company->id)
                    ->first();

                if ($existingEmployee) {
                    if ($existingEmployee->status === 'approved') {
                        return redirect()->back()->with('error', 'This user is already an approved employee of your company.');
                    } elseif ($existingEmployee->status === 'pending') {
                        return redirect()->back()->with('error', 'This user already has a pending request to join your company.');
                    } elseif ($existingEmployee->status === 'left') {
                        // Re-approve the user
                        $existingEmployee->update([
                            'status' => 'approved',
                            'approved_at' => now(),
                            'approved_by' => $admin->id,
                            'left_at' => null,
                        ]);

                        $user->update([
                            'is_employee' => true,
                            'company_id' => $company->id,
                            'company_name' => $company->name,
                        ]);

                        DB::commit();
                        return redirect()->back()->with('success', 'Employee re-added successfully!');
                    }
                } else {
                    // User exists but not linked to this company, create employee record
                    CompanyEmployee::create([
                        'company_id' => $company->id,
                        'user_id' => $user->id,
                        'status' => 'approved',
                        'requested_at' => now(),
                        'approved_at' => now(),
                        'approved_by' => $admin->id,
                        'home_address' => $request->home_address,
                        'home_lat' => $request->home_lat,
                        'home_lng' => $request->home_lng,
                    ]);

                    // Sync to user's favorites as 'home' for future passenger-side use
                    FavoriteLocation::updateOrCreate(
                        ['user_id' => $user->id, 'type' => 'home'],
                        [
                            'address' => $request->home_address,
                            'latitude' => $request->home_lat,
                            'longitude' => $request->home_lng,
                            'name' => 'Home',
                            'is_active' => true
                        ]
                    );

                    $user->update([
                        'is_employee' => true,
                        'company_id' => $company->id,
                        'company_name' => $company->name,
                    ]);

                    DB::commit();
                    return redirect()->back()->with('success', 'Existing user added as employee successfully!');
                }
            } else {
                // User doesn't exist, create new user
                if (!$request->name || !$request->password) {
                    return redirect()->back()->with('error', 'User not found. Please provide name and password to create a new account.');
                }

                // Check if email is unique (if provided)
                if ($request->email && User::where('email', $request->email)->exists()) {
                    return redirect()->back()->with('error', 'A user with this email already exists.');
                }

                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email ?? null,
                    'phone' => $request->phone,
                    'password' => bcrypt($request->password),
                    'role' => 'passenger', // Employees can also be passengers
                    'is_employee' => true,
                    'company_id' => $company->id,
                    'company_name' => $company->name,
                ]);

                // Create company employee record
                CompanyEmployee::create([
                    'company_id' => $company->id,
                    'user_id' => $user->id,
                    'status' => 'approved',
                    'requested_at' => now(),
                    'approved_at' => now(),
                    'approved_by' => $admin->id,
                    'home_address' => $request->home_address,
                    'home_lat' => $request->home_lat,
                    'home_lng' => $request->home_lng,
                ]);

                // Also save as favorite
                FavoriteLocation::create([
                    'user_id' => $user->id,
                    'type' => 'home',
                    'address' => $request->home_address,
                    'latitude' => $request->home_lat,
                    'longitude' => $request->home_lng,
                    'name' => 'Home',
                    'is_active' => true
                ]);

                DB::commit();
                return redirect()->back()->with('success', 'New employee created and added successfully!');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to add employee', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return redirect()->back()->with('error', 'Failed to add employee: ' . $e->getMessage());
        }
    }

    /**
     * Add multiple employees via CSV upload
     */
    public function addBulkEmployees(Request $request)
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        $validator = Validator::make($request->all(), [
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        try {
            $file = $request->file('csv_file');
            $csvData = array_map('str_getcsv', file($file->getPathname()));

            // Remove header row
            $header = array_shift($csvData);

            // Validate CSV format
            $expectedHeaders = ['phone', 'name', 'email', 'password'];
            if (array_diff($expectedHeaders, array_map('strtolower', $header))) {
                return redirect()->back()->with('error', 'Invalid CSV format. Expected headers: phone, name, email, password');
            }

            $successCount = 0;
            $errorCount = 0;
            $errors = [];

            DB::beginTransaction();

            foreach ($csvData as $index => $row) {
                try {
                    // Skip empty rows
                    if (empty(array_filter($row))) {
                        continue;
                    }

                    $data = array_combine($expectedHeaders, $row);

                    // Validate row data
                    $rowValidator = Validator::make($data, [
                        'phone' => 'required|string|max:20',
                        'name' => 'required|string|max:255',
                        'email' => 'required|email|unique:users,email',
                        'password' => 'required|string|min:8',
                    ]);

                    if ($rowValidator->fails()) {
                        $errors[] = "Row " . ($index + 2) . ": " . implode(', ', $rowValidator->errors()->all());
                        $errorCount++;
                        continue;
                    }

                    // Check if user exists by phone (flexible search)
                    $phone = $data['phone'];
                    $searchPhones = [$phone];
                    $cleanPhone = preg_replace('/[^0-9]/', '', $phone);

                    if (str_starts_with($cleanPhone, '251')) {
                        $searchPhones[] = '0' . substr($cleanPhone, 3);
                        $searchPhones[] = '+' . $cleanPhone;
                        $searchPhones[] = $cleanPhone;
                    } elseif (str_starts_with($cleanPhone, '09') || str_starts_with($cleanPhone, '07')) {
                        $searchPhones[] = '251' . substr($cleanPhone, 1);
                        $searchPhones[] = '+251' . substr($cleanPhone, 1);
                    }

                    $user = User::whereIn('phone', array_unique($searchPhones))->first();

                    if ($user) {
                        // User exists, check if they're already an employee
                        $existingEmployee = CompanyEmployee::where('user_id', $user->id)
                            ->where('company_id', $company->id)
                            ->first();

                        if ($existingEmployee) {
                            if ($existingEmployee->status === 'approved') {
                                $errors[] = "Row " . ($index + 2) . ": User is already an approved employee";
                                $errorCount++;
                                continue;
                            } elseif ($existingEmployee->status === 'pending') {
                                $errors[] = "Row " . ($index + 2) . ": User already has a pending request";
                                $errorCount++;
                                continue;
                            } elseif ($existingEmployee->status === 'left') {
                                // Re-approve the user
                                $existingEmployee->update([
                                    'status' => 'approved',
                                    'approved_at' => now(),
                                    'approved_by' => $admin->id,
                                    'left_at' => null,
                                ]);

                                $user->update([
                                    'is_employee' => true,
                                    'company_id' => $company->id,
                                    'company_name' => $company->name,
                                ]);
                            }
                        } else {
                            // User exists but not linked to this company
                            CompanyEmployee::create([
                                'company_id' => $company->id,
                                'user_id' => $user->id,
                                'status' => 'approved',
                                'requested_at' => now(),
                                'approved_at' => now(),
                                'approved_by' => $admin->id,
                            ]);

                            $user->update([
                                'is_employee' => true,
                                'company_id' => $company->id,
                                'company_name' => $company->name,
                            ]);
                        }
                    } else {
                        // User doesn't exist, create new user
                        $user = User::create([
                            'name' => $data['name'],
                            'email' => $data['email'] ?? null,
                            'phone' => $data['phone'],
                            'password' => bcrypt($data['password']),
                            'role' => 'passenger', // Employees can also be passengers
                            'is_employee' => true,
                            'company_id' => $company->id,
                            'company_name' => $company->name,
                        ]);

                        // Create company employee record
                        CompanyEmployee::create([
                            'company_id' => $company->id,
                            'user_id' => $user->id,
                            'status' => 'approved',
                            'requested_at' => now(),
                            'approved_at' => now(),
                            'approved_by' => $admin->id,
                        ]);
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
                    $errorCount++;
                }
            }

            DB::commit();

            $message = "Bulk import completed. Success: {$successCount}, Errors: {$errorCount}";
            if (!empty($errors)) {
                $message .= "\nErrors: " . implode("\n", array_slice($errors, 0, 10));
                if (count($errors) > 10) {
                    $message .= "\n... and " . (count($errors) - 10) . " more errors";
                }
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to process CSV file: ' . $e->getMessage());
        }
    }

    /**
     * Show detailed employee information
     */
    public function showEmployee($id)
    {
        $admin = auth()->user();
        $company = $admin->company;

        if (!$company) {
            abort(404, 'Company not found');
        }

        $employee = CompanyEmployee::with(['user'])
            ->where('id', $id)
            ->where('company_id', $company->id)
            ->firstOrFail();

        // Get some stats for the employee
        $stats = [
            'total_rides' => CompanyGroupRideInstance::where('employee_id', $employee->user_id)
                ->where('company_id', $company->id)
                ->count(),
            'completed_rides' => CompanyGroupRideInstance::where('employee_id', $employee->user_id)
                ->where('company_id', $company->id)
                ->where('status', 'completed')
                ->count(),
            'cancelled_rides' => CompanyGroupRideInstance::where('employee_id', $employee->user_id)
                ->where('company_id', $company->id)
                ->where('status', 'cancelled')
                ->count(),
        ];

        return Inertia::render('company-admin/employee-detail', [
            'employee' => $employee,
            'company' => $company,
            'stats' => $stats,
        ]);
    }
}
