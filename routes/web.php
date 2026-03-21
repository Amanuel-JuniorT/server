<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\VehicleTypeController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();
        // Debug: Log user information
        \Log::info('User logged in', [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'not set',
            'company_id' => $user->company_id ?? 'not set'
        ]);

        if ($user->role === 'company_admin') {
            return redirect()->route('company-admin.dashboard');
        } else {
            return redirect()->route('dashboard');
        }
    }
    return redirect()->route('login');
})->name('home');

Route::get('request-ride', [\App\Http\Controllers\ManualRideController::class, 'index'])->name('request-ride');
Route::get('api/passengers/search', [\App\Http\Controllers\ManualRideController::class, 'searchPassenger'])->name('api.passengers.search');
Route::post('request-ride', [\App\Http\Controllers\ManualRideController::class, 'store'])->name('request-ride.store');
Route::post('request-ride/{id}/retry', [\App\Http\Controllers\ManualRideController::class, 'retry'])->name('request-ride.retry');
Route::post('request-ride/{id}/cancel', [\App\Http\Controllers\ManualRideController::class, 'cancel'])->name('request-ride.cancel');

// Invitation Acceptance (Public)
Route::get('admin/accept-invitation/{token}', [\App\Http\Controllers\Admin\InvitationController::class, 'showAcceptForm'])->name('admin.invitation.accept');
Route::post('admin/accept-invitation', [\App\Http\Controllers\Admin\InvitationController::class, 'accept'])->name('admin.invitation.process');

// Super Admin routes
Route::middleware(['auth', 'verified', \App\Http\Middleware\EnsureUserIsSuperAdmin::class])->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('passengers', [AdminDashboardController::class, 'passengers'])->name('passengers');
    Route::get('drivers', [AdminDashboardController::class, 'driversAlt'])->name('drivers');

    Route::get('rides', [AdminDashboardController::class, 'getRides'])->name('rides');


    // Company management routes
    Route::get('companies', [AdminDashboardController::class, 'companies'])->name('companies');
    Route::post('companies', [AdminDashboardController::class, 'createCompany'])->name('companies.create');
    Route::put('companies/{id}', [AdminDashboardController::class, 'updateCompany'])->name('companies.update');
    Route::delete('companies/{id}', [AdminDashboardController::class, 'deleteCompany'])->name('companies.delete');
    Route::post('companies/{id}/assign-driver', [AdminDashboardController::class, 'assignDriverToCompany'])->name('companies.assign-driver');

    Route::get('company-employees', [AdminDashboardController::class, 'companyEmployees'])->name('company-employees');
    Route::post('company-employees/{id}/approve', [AdminDashboardController::class, 'approveEmployee'])->name('company-employees.approve');
    Route::post('company-employees/{id}/reject', [AdminDashboardController::class, 'rejectEmployee'])->name('company-employees.reject');



    // Driver approval routes
    Route::post('drivers/{driver}/approve', [AdminDashboardController::class, 'approveDriver'])->name('drivers.approve');
    Route::post('drivers/{driver}/reject', [AdminDashboardController::class, 'rejectDriver'])->name('drivers.reject');

    // User routes
    Route::get('passenger/profile/{id}', [AdminDashboardController::class, 'passengerProfile'])->name('passenger.profile');

    Route::get('driver/profile/{id}', [AdminDashboardController::class, 'driverProfile'])->name('driver.profile');
    Route::get('company/profile/{id}', [AdminDashboardController::class, 'companyProfile'])->name('company.profile');
    Route::get('company/{id}/employees', [AdminDashboardController::class, 'companyEmployeesView'])->name('company.employees');
    Route::get('company/{id}/drivers', [AdminDashboardController::class, 'companyDriversView'])->name('company.drivers');

    Route::get('passenger/rides/{id}', [AdminDashboardController::class, 'passengerRides'])->name('passenger.rides');
    Route::get('passenger/payments/{id}', [AdminDashboardController::class, 'passengerPayments'])->name('passenger.payments');
    Route::get('passenger/favorites/{id}', [AdminDashboardController::class, 'passengerFavorites'])->name('passenger.favorites');

    Route::get('driver/trips/{id}', [AdminDashboardController::class, 'driverTrips'])->name('driver.trips');
    Route::get('driver/earnings/{id}', [AdminDashboardController::class, 'driverEarnings'])->name('driver.earnings');
    Route::get('driver/vehicle/{id}', [AdminDashboardController::class, 'driverVehicle'])->name('driver.vehicle');
    Route::get('driver/schedule/{id}', [AdminDashboardController::class, 'driverSchedule'])->name('driver.schedule');

    Route::get('driver/location/{id}', [AdminDashboardController::class, 'driverLocation'])->name('driver.location');

    // Vehicle Type Management
    Route::resource('vehicle-types', VehicleTypeController::class);
    Route::post('vehicle-types/{id}/toggle-status', [VehicleTypeController::class, 'toggleStatus'])->name('vehicle-types.toggle-status');

    // FCM Notifications
    Route::post('admin/notifications/send', [\App\Http\Controllers\AdminNotificationController::class, 'send'])->name('admin.notifications.send');
    Route::get('notifications', function () {
        return Inertia::render('notifications');
    })->name('notifications');

    // Promotions Page
    Route::get('promotions', function () {
        return Inertia::render('promotions');
    })->name('promotions');

    // Company Ride Groups (NEW)
    Route::get('companies/{id}/ride-groups', function ($id) {
        return Inertia::render('company-ride-groups', ['companyId' => $id]);
    })->name('company.ride-groups');



    // JSON endpoints for ride groups
    Route::get('admin/company/{companyId}/ride-groups/list', [\App\Http\Controllers\CompanyRideGroupController::class, 'index']);
    Route::post('admin/company/{companyId}/ride-groups', [\App\Http\Controllers\CompanyRideGroupController::class, 'store']);
    Route::put('admin/company/{companyId}/ride-groups/{groupId}', [\App\Http\Controllers\CompanyRideGroupController::class, 'update']);
    Route::delete('admin/company/{companyId}/ride-groups/{groupId}', [\App\Http\Controllers\CompanyRideGroupController::class, 'destroy']);
    Route::post('admin/company/{companyId}/ride-groups/{groupId}/members', [\App\Http\Controllers\CompanyRideGroupController::class, 'addMember']);
    Route::delete('admin/company/{companyId}/ride-groups/{groupId}/members/{employeeId}', [\App\Http\Controllers\CompanyRideGroupController::class, 'removeMember']);
    Route::post('admin/company/{companyId}/ride-groups/{groupId}/assign', [\App\Http\Controllers\CompanyRideGroupController::class, 'assignDriver']);

    // JSON endpoints for payment receipts
    Route::get('admin/payment-receipts/pending', [\App\Http\Controllers\CompanyPaymentReceiptController::class, 'getPending']);
    Route::post('admin/payment-receipts/{receiptId}/verify', [\App\Http\Controllers\CompanyPaymentReceiptController::class, 'verify']);
    Route::post('admin/payment-receipts/{receiptId}/reject', [\App\Http\Controllers\CompanyPaymentReceiptController::class, 'reject']);

    // Promotions JSON API (Session-based)
    Route::get('admin/promotions/list', [\App\Http\Controllers\PromotionController::class, 'adminIndex']);
    Route::post('admin/promotions', [\App\Http\Controllers\PromotionController::class, 'store']);
    Route::delete('admin/promotions/{id}', [\App\Http\Controllers\PromotionController::class, 'destroy']);
    Route::patch('admin/promotions/{id}/toggle', [\App\Http\Controllers\PromotionController::class, 'toggleActive']);

    // Admin Wallet / Top-up Verification
    Route::get('admin/wallet/topups', [\App\Http\Controllers\AdminWalletController::class, 'getTopups']);
    Route::post('admin/wallet/topups/{id}/verify', [\App\Http\Controllers\AdminWalletController::class, 'verifyTopup']);
    Route::post('admin/wallet/topups/{id}/reject', [\App\Http\Controllers\AdminWalletController::class, 'rejectTopup']);

    // Admin Management (Invitation System)
    Route::get('admin/admins', [\App\Http\Controllers\Admin\AdminManagementController::class, 'index'])->name('admin.admins');
    Route::post('admin/admins/invite', [\App\Http\Controllers\Admin\InvitationController::class, 'store'])->name('admin.invite');
    Route::post('admin/admins/{id}/deactivate', [\App\Http\Controllers\Admin\AdminManagementController::class, 'deactivate']);
    Route::post('admin/admins/{id}/reactivate', [\App\Http\Controllers\Admin\AdminManagementController::class, 'reactivate']);
    Route::post('admin/invitations/{token}/resend', [\App\Http\Controllers\Admin\InvitationController::class, 'resend']);
    Route::delete('admin/invitations/{token}', [\App\Http\Controllers\Admin\InvitationController::class, 'cancel']);

    // SOS Management
    Route::get('sos', [\App\Http\Controllers\AdminSosController::class, 'index'])->name('sos.index');
    Route::post('sos/{alert}/resolve', [\App\Http\Controllers\AdminSosController::class, 'resolve'])->name('sos.resolve');

    // Ride Details
    Route::get('rides/{id}', [AdminDashboardController::class, 'showRide'])->name('rides.show');
    Route::get('rides/track/{id}', [AdminDashboardController::class, 'trackRide'])->name('rides.track');
    Route::get('rides/timeline/{id}', [AdminDashboardController::class, 'rideTimeline'])->name('rides.timeline');

    // Transactions, Logs & Audit
    Route::get('transactions', [AdminDashboardController::class, 'transactions'])->name('transactions.index');
    Route::get('logs', [AdminDashboardController::class, 'logs'])->name('logs.index');
    Route::get('audit', [AdminDashboardController::class, 'audit'])->name('audit.index');
});

// Company Admin routes
Route::middleware(['auth', 'verified', \App\Http\Middleware\EnsureUserIsCompanyAdmin::class])->prefix('company-admin')->group(function () {
    Route::get('dashboard', [App\Http\Controllers\CompanyAdminController::class, 'dashboard'])->name('company-admin.dashboard');
    Route::get('employees', [App\Http\Controllers\CompanyAdminController::class, 'employees'])->name('company-admin.employees');
    Route::post('employees', [App\Http\Controllers\CompanyAdminController::class, 'addEmployee'])->name('company-admin.employees.add');
    Route::post('employees/bulk', [App\Http\Controllers\CompanyAdminController::class, 'addBulkEmployees'])->name('company-admin.employees.bulk');
    Route::post('employees/{id}/approve', [App\Http\Controllers\CompanyAdminController::class, 'approveEmployee'])->name('company-admin.employees.approve');
    Route::post('employees/{id}/reject', [App\Http\Controllers\CompanyAdminController::class, 'rejectEmployee'])->name('company-admin.employees.reject');
    Route::delete('employees/{id}', [App\Http\Controllers\CompanyAdminController::class, 'removeEmployee'])->name('company-admin.employees.remove');
    Route::get('employees/{id}', [App\Http\Controllers\CompanyAdminController::class, 'showEmployee'])->name('company-admin.employees.show');
    Route::get('drivers', [App\Http\Controllers\CompanyAdminController::class, 'drivers'])->name('company-admin.drivers');
    Route::get('profile', [App\Http\Controllers\CompanyAdminController::class, 'profile'])->name('company-admin.profile');
    Route::put('profile', [App\Http\Controllers\CompanyAdminController::class, 'updateProfile'])->name('company-admin.profile.update');

    // Ride Groups (NEW)
    Route::get('ride-groups', function () {
        $user = auth()->user();
        $companyId = $user->company_id;
        return Inertia::render('company-admin/ride-groups', ['companyId' => $companyId]);
    })->name('company-admin.ride-groups');

    // Payment Receipts (NEW)
    Route::get('payment-receipts', function () {
        $user = auth()->user();
        $companyId = $user->company_id;
        return Inertia::render('company-admin/payment-receipts', ['companyId' => $companyId]);
    })->name('company-admin.payment-receipts');

    // JSON API endpoints for ride groups (company admin can only access their own company)
    Route::get('api/ride-groups', function (Illuminate\Http\Request $request) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->index($companyId);
    });
    Route::post('api/ride-groups', function (Illuminate\Http\Request $request) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->store($request, $companyId);
    });
    Route::put('api/ride-groups/{groupId}', function (Illuminate\Http\Request $request, $groupId) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->update($request, $companyId, $groupId);
    });
    Route::delete('api/ride-groups/{groupId}', function (Illuminate\Http\Request $request, $groupId) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->destroy($companyId, $groupId);
    });
    Route::get('api/ride-groups/{groupId}', function (Illuminate\Http\Request $request, $groupId) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->show($companyId, $groupId);
    });
    Route::get('api/reports', function (Illuminate\Http\Request $request) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->reports($request, $companyId);
    });
    Route::post('api/ride-groups/{groupId}/members', function (Illuminate\Http\Request $request, $groupId) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->addMember($request, $companyId, $groupId);
    });
    Route::delete('api/ride-groups/{groupId}/members/{employeeId}', function (Illuminate\Http\Request $request, $groupId, $employeeId) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->removeMember($companyId, $groupId, $employeeId);
    });
    Route::post('api/ride-groups/{groupId}/assign', function (Illuminate\Http\Request $request, $groupId) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyRideGroupController::class)->assignDriver($request, $companyId, $groupId);
    });

    // JSON API endpoints for payment receipts (company admin can only access their own company)
    Route::get('api/payment-receipts', function (Illuminate\Http\Request $request) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyPaymentReceiptController::class)->index($companyId);
    });
    Route::post('api/payment-receipts', function (Illuminate\Http\Request $request) {
        $user = auth()->user();
        $companyId = $user->company_id;
        return app(\App\Http\Controllers\CompanyPaymentReceiptController::class)->store($request, $companyId);
    });

    // Get company employees for ride group member selection
    Route::get('api/employees', function (Illuminate\Http\Request $request) {
        $user = auth()->user();
        $companyId = $user->company_id;

        $employees = \App\Models\CompanyEmployee::where('company_id', $companyId)
            ->where('status', 'approved')
            ->with('user:id,name,email')
            ->get()
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'user_id' => $employee->user_id,
                    'name' => $employee->user->name ?? 'Unknown',
                    'email' => $employee->user->email ?? '',
                    'home_address' => $employee->home_address,
                    'home_lat' => $employee->home_lat,
                    'home_lng' => $employee->home_lng,
                ];
            });

        return response()->json(['success' => true, 'data' => $employees]);
    });

    // Get company details (for office address)
    Route::get('api/company-info', function (Illuminate\Http\Request $request) {
        $user = auth()->user();
        $companyId = $user->company_id;

        $company = \App\Models\Company::find($companyId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $company->id,
                'name' => $company->name,
                'address' => $company->address,
                'latitude' => $company->default_origin_lat,
                'longitude' => $company->default_origin_lng,
            ]
        ]);
    });
});

// Route::get('user/payments/{id}', function ($id) {
//     if (auth()->check()) {
//         $user = auth()->user();
//         if ($user->role === 'passenger') {
//             return redirect()->route('passenger.payments', ['id' => $id]);
//         } elseif ($user->role === 'driver') {
//             // Drivers use earnings page for payments info
//             return redirect()->route('driver.earnings', ['id' => $id]);
//         }
//     }
//     abort(404);
// })->middleware('auth');

Route::get('user/payments/{id}', function ($id) {
    $user = User::findOrFail($id);
    if (!$user) {
        abort(404);
    }
    $isDriver = $user->role === 'driver';
    if ($isDriver) {
        return redirect()->route('driver.earnings', ['id' => $id]);
    } else {
        return redirect()->route('passenger.payments', ['id' => $id]);
    }
})->middleware('auth');



// Route::get('user/payments', function () {
//     return Inertia::render('user/payments');
// })->name('user.payments');

// Route::get('user/favorites', function () {
//     return Inertia::render('user/favorites');
// })->name('user.favorites');

// Route::get('user/preferences', function () {
//     return Inertia::render('user/preferences');
// })->name('user.preferences');

// // Driver-specific routes
// Route::get('user/trips', function () {
//     return Inertia::render('user/trips');
// })->name('user.trips');

// Route::get('user/earnings', function () {
//     return Inertia::render('user/earnings');
// })->name('user.earnings');

// Route::get('user/vehicle', function () {
//     return Inertia::render('user/vehicle');
// })->name('user.vehicle');

// Route::get('user/schedule', function () {
//     return Inertia::render('user/schedule');
// })->name('user.schedule');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/render.php';
