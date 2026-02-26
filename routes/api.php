<?php


use App\Http\Controllers\DriverTripController;
use App\Http\Controllers\RideController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthManager;
use App\Http\Controllers\DriverProfileController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\DriverStatusController;
use App\Http\Controllers\Wallet_Controller;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CompanyRideDriverController;
use App\Http\Controllers\CompanyRideAdminController;
use App\Http\Controllers\CompanyDriverContractController;
use Illuminate\Http\Request;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AdminCompanyController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PassengerController;
use App\Http\Controllers\EmployeeRideController;
use App\Http\Controllers\CompanyRideGroupController;
use App\Http\Controllers\CompanyPaymentReceiptController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\FcmTokenController;
use App\Http\Controllers\FavoriteLocationController;
use App\Http\Controllers\WalletController;


Route::get('/vehicle-types', [RideController::class, 'getVehicleTypes']);

Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Public / Early Routes
Route::post('/vehicles', [VehicleController::class, 'store']);
Route::post('/login', [AuthManager::class, 'login']);
Route::post('/register', [AuthManager::class, 'register']);
Route::get('/users', [UserController::class, 'index']);
Route::post('/users/register', [UserController::class, 'register']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::middleware('auth:sanctum')->post('/driver/submit-details', [DriverProfileController::class, 'submit']);

Route::get('/app/bootstrap', [App\Http\Controllers\BootstrapController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    
    Route::get('/driver/approval_status', [AuthManager::class, 'getDriverApprovalStatus']);
    Route::post('/logout', [AuthManager::class, 'logout']);
    Route::get('/profile', [AuthManager::class, 'getUserProfile']);
    
    // FCM Token Management
    Route::post('/fcm/register', [FcmTokenController::class, 'register']);
    Route::post('/fcm/unregister', [FcmTokenController::class, 'unregister']);
});

// Driver
// Route::middleware('auth:sanctum')->post('/driver/update-status', [DriverProfileController::class, 'updateStatus']);
// Route::patch('/driver/status', [DriverProfileController::class, 'updateStatus']);
Route::middleware('auth:sanctum')->patch('/driver/status', [DriverProfileController::class, 'updateStatus']);
Route::middleware('auth:sanctum')->post('/driver/location', [DriverProfileController::class, 'updateLocation']);

Route::middleware('auth:sanctum')->post('driver/status', [DriverStatusController::class, 'updateStatus']);

Route::get('/nearby-drivers', [DriverProfileController::class, 'getNearbyDrivers']);


Route::middleware('auth:sanctum')->post('/ride', [RideController::class, 'requestRide']);


// ride routes
// Route::middleware('auth:sanctum')->group(function () { 
//     // ... my existing routes ...
//     Route::post('/ride/{id}/accept', [\App\Http\Controllers\RideController::class, 'accept']);
//     Route::post('/ride/{id}/reject', [\App\Http\Controllers\RideController::class, 'reject']);
// });
// Route::middleware('auth:sanctum')->get('/ride/{id}/started', [RideController::class, 'startRide']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/passenger/profile', [PassengerController::class, 'getPassengerProfile']);
    Route::post('/passenger/edit-profile', [PassengerController::class, 'editPassengerProfile']);
    Route::get('/passenger/rides', [PassengerController::class, 'passengerRides']);
    Route::post('/ride/request', [RideController::class, 'requestRide']);
    Route::get('/ride/active', [RideController::class, 'getActiveRide']);
    Route::get('/ride/history', [RideController::class, 'history']);
    Route::get('/ride/{id}', [RideController::class, 'getRideDetails']);
    Route::post('/ride/{id}/accept', [RideController::class, 'accept']);
    Route::post('/ride/{id}/reject', [RideController::class, 'reject']);
    Route::post('/ride/{id}/start', [RideController::class, 'startRide']);
    Route::post('/ride/{id}/complete', [RideController::class, 'completeRide']);
    Route::post('/ride/{id}/confirm-payment', [RideController::class, 'confirmWalletPayment']);
    Route::post('/ride/{id}/status', [RideController::class, 'updateStatus']);
    Route::post('/ride/{id}/cancel', [RideController::class, 'cancelRide']);
    Route::post('/ride/{id}/rate', [RideController::class, 'rate']);
    Route::post('/ride/{id}/pay', [RideController::class, 'payUpfront']);
    Route::get('/driver/{driverId}/rating-stats', [RideController::class, 'getDriverRatingStats']);

    // Favorite Locations
    Route::get('/favorites', [FavoriteLocationController::class, 'index']);
    Route::post('/favorites/sync', [FavoriteLocationController::class, 'sync']);

    // Pooling Routes
    Route::post('/ride/pool/request', [\App\Http\Controllers\PoolingController::class, 'requestPoolRide']);
    Route::post('/ride/pool/{poolingId}/passenger-response', [\App\Http\Controllers\PoolingController::class, 'passengerResponse']);
    Route::post('/ride/pool/{poolingId}/driver-response', [\App\Http\Controllers\PoolingController::class, 'driverResponse']);
    Route::delete('/ride/pool/{poolingId}/cancel', [\App\Http\Controllers\PoolingController::class, 'cancelPoolRequest']);
});

Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

// Check if user exists by phone number
Route::get('/users/check-phone', function (Request $request) {
    $phone = $request->query('phone');
    $companyId = $request->query('company_id');

    if (!$phone) {
        return response()->json(['exists' => false], 400);
    }

    $searchPhones = [];
    $searchPhones[] = $phone;
    $cleanPhone = preg_replace('/[^0-9]/', '', $phone);

    if (str_starts_with($cleanPhone, '251')) {
        $localFormat = '0' . substr($cleanPhone, 3);
        $plusFormat = '+' . $cleanPhone;
        $searchPhones[] = $localFormat;
        $searchPhones[] = $plusFormat;
        $searchPhones[] = $cleanPhone;
    } elseif (str_starts_with($cleanPhone, '09') || str_starts_with($cleanPhone, '07')) {
        $intlFormat = '251' . substr($cleanPhone, 1);
        $plusFormat = '+251' . substr($cleanPhone, 1);
        $searchPhones[] = $intlFormat;
        $searchPhones[] = $plusFormat;
    }

    $user = \App\Models\User::whereIn('phone', array_unique($searchPhones))->first();

    if ($user) {
        $response = [
            'exists' => true,
            'name' => $user->name,
            'email' => $user->email,
        ];

        if ($companyId) {
            $employee = \App\Models\CompanyEmployee::where('user_id', $user->id)
                ->where('company_id', $companyId)
                ->first();

            if ($employee) {
                $response['isEmployee'] = true;
                $response['employeeStatus'] = $employee->status;
            } else {
                $response['isEmployee'] = false;
            }
        }

        return response()->json($response);
    }

    return response()->json(['exists' => false]);
});

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('wallet/validate-recipient/{phone}', [WalletController::class, 'getReceiver']);
    Route::get('wallet', [WalletController::class, 'index']);
    Route::get('wallet/transactions', [WalletController::class, 'transactions']);
    Route::post('wallet/withdraw', [WalletController::class, 'withdraw']);
    Route::post('wallet/topup', [WalletController::class, 'topup']);
    Route::post('wallet/transfer', [WalletController::class, 'transfer']);


    // Notifications
    Route::post('/notifications/admin', [NotificationController::class, 'sendAdminNotification']);
    Route::post('/notifications/driver', [NotificationController::class, 'sendDriverNotification']);
    Route::post('/notifications/ride-request', [NotificationController::class, 'sendRideRequestNotification']);
    Route::post('/notifications/payment', [NotificationController::class, 'sendPaymentNotification']);
    Route::get('/notifications/stats', [NotificationController::class, 'getNotificationStats']);

    // FCM Token
    Route::post('/fcm/register', [App\Http\Controllers\FcmTokenController::class, 'register']);
    Route::delete('/fcm/register', [App\Http\Controllers\FcmTokenController::class, 'unregister']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/driver/profile', [DriverProfileController::class, 'getProfile']);
    Route::post('/driver/profile', [DriverProfileController::class, 'updateProfile']);
    Route::get('/driver/stats', [DriverProfileController::class, 'getStats']);
    Route::get('/driver/rides/history', [DriverTripController::class, 'history']);
    Route::get('/driver/companies/available', [CompanyController::class, 'getAvailableCompanies']);

    Route::post('/driver/change-password', [DriverProfileController::class, 'changePassword']);
    Route::post('/driver/toggle-2fa', [DriverProfileController::class, 'toggleTwoFactor']);
    Route::post('/driver/documents', [DriverProfileController::class, 'uploadDocument']);
    Route::get('/driver/documents', [DriverProfileController::class, 'getDocuments']);
    Route::post('/driver/delete-account', [DriverProfileController::class, 'deleteAccount']);

    // Driver Company Ride Management (Consolidated)
    Route::get('/driver/company-rides', [CompanyRideDriverController::class, 'getAssignedRides']);
    Route::get('/driver/company-rides/available', [CompanyRideDriverController::class, 'getAvailableRides']);
    Route::get('/driver/company-ride/active', [CompanyRideDriverController::class, 'getActiveRide']);
    Route::get('/driver/company-ride/{id}', [CompanyRideDriverController::class, 'getRide']);
    Route::post('/driver/company-ride/{id}/accept', [CompanyRideDriverController::class, 'acceptRide']);
    Route::post('/driver/company-ride/{id}/start', [CompanyRideDriverController::class, 'startRide']);
    Route::post('/driver/company-ride/{id}/arrived', [CompanyRideDriverController::class, 'arrived']);
    Route::post('/driver/company-ride/{id}/complete', [CompanyRideDriverController::class, 'completeRide']);
    Route::post('/driver/company-ride/{id}/cancel', [CompanyRideDriverController::class, 'cancelRide']);

    // Admin Company Ride Management
    Route::post('/admin/company-ride/{id}/assign-driver', [CompanyRideAdminController::class, 'assignDriver']);
    Route::get('/admin/company-rides/pending', [CompanyRideAdminController::class, 'getPendingRides']);
    Route::get('/admin/company-rides/stats', [CompanyRideAdminController::class, 'getCompanyRideStats']);
    Route::get('/admin/stats', [AdminDashboardController::class, 'adminStats']);

    // Company Management
    Route::post('/company/register', [CompanyController::class, 'register']);
    Route::get('/company/list', [CompanyController::class, 'list']);
    Route::get('/company/{id}', [CompanyController::class, 'show']);
    Route::put('/company/{id}', [CompanyController::class, 'update']);
    Route::delete('/company/{id}', [CompanyController::class, 'delete']);

    // Employee-Company Linking
    Route::post('/employee/link-company', [EmployeeController::class, 'linkCompany']);
    Route::get('/employee/company-info', [EmployeeController::class, 'getCompanyInfo']);
    Route::post('/employee/leave-company', [EmployeeController::class, 'leaveCompany']);
    Route::post('/employee/cancel-link-request', [EmployeeController::class, 'cancelLinkRequest']);
    Route::get('/employee/company-rides', [EmployeeRideController::class, 'getCompanyRides']);
    Route::get('/employee/ride-groups', [EmployeeRideController::class, 'getMyRideGroups']);

    // Admin Company Management
    Route::get('/admin/company-employees', [AdminCompanyController::class, 'getEmployees']);
    Route::get('/admin/company-employees/pending', [AdminCompanyController::class, 'getPendingEmployees']);
    Route::get('/admin/company-employees/{id}', [AdminCompanyController::class, 'getEmployeeRequest']);
    Route::post('/admin/company-employees/{id}/approve', [AdminCompanyController::class, 'approveEmployee']);
    Route::post('/admin/company-employees/{id}/reject', [AdminCompanyController::class, 'rejectEmployee']);
    Route::get('/admin/company-stats', [AdminCompanyController::class, 'getCompanyStats']);

    // Company Driver Contracts
    Route::post('/company/{companyId}/contracts', [CompanyDriverContractController::class, 'store']);
    Route::get('/company/{companyId}/contracts', [CompanyDriverContractController::class, 'index']);
    Route::get('/company/{companyId}/contracts/active', [CompanyDriverContractController::class, 'activeContracts']);
    Route::put('/contracts/{id}', [CompanyDriverContractController::class, 'update']);
    Route::get('/driver/contracts', [CompanyDriverContractController::class, 'driverContracts']);

    // Company Ride Groups
    Route::get('/admin/company/{companyId}/ride-groups', [CompanyRideGroupController::class, 'index']);
    Route::post('/admin/company/{companyId}/ride-groups', [CompanyRideGroupController::class, 'store']);
    Route::get('/admin/company/{companyId}/ride-groups/{groupId}', [CompanyRideGroupController::class, 'show']);
    Route::put('/admin/company/{companyId}/ride-groups/{groupId}', [CompanyRideGroupController::class, 'update']);
    Route::delete('/admin/company/{companyId}/ride-groups/{groupId}', [CompanyRideGroupController::class, 'destroy']);
    Route::post('/admin/company/{companyId}/ride-groups/{groupId}/members', [CompanyRideGroupController::class, 'addMember']);
    Route::delete('/admin/company/{companyId}/ride-groups/{groupId}/members/{employeeId}', [CompanyRideGroupController::class, 'removeMember']);
    Route::post('/admin/company/{companyId}/ride-groups/{groupId}/assign', [CompanyRideGroupController::class, 'assignDriver']);

    // Payment Receipts
    Route::post('/admin/company/{companyId}/payment-receipts', [CompanyPaymentReceiptController::class, 'store']);
    Route::get('/admin/company/{companyId}/payment-receipts', [CompanyPaymentReceiptController::class, 'index']);
    Route::get('/admin/payment-receipts/pending', [CompanyPaymentReceiptController::class, 'getPending']);
    Route::post('/admin/payment-receipts/{receiptId}/verify', [CompanyPaymentReceiptController::class, 'verify']);
    Route::post('/admin/payment-receipts/{receiptId}/reject', [CompanyPaymentReceiptController::class, 'reject']);

    // Driver Ride Group Assignments
    Route::get('/driver/ride-groups/available', [CompanyRideGroupController::class, 'getAvailableForDriver']);
    Route::post('/driver/ride-group-assignment/{assignmentId}/accept', [CompanyRideGroupController::class, 'acceptAssignment']);
    Route::get('/driver/ride-group-assignments', [CompanyRideGroupController::class, 'getDriverAssignments']);

    Route::post('/driver/request-data-download', [DriverProfileController::class, 'requestDataDownload']);
    Route::post('/straight-hail', [RideController::class, 'straightHail']);
});

// Promotion routes

// Public routes - drivers and passengers can view active promotions
Route::get('/promotions', [PromotionController::class, 'index']);
Route::get('/promotions/{id}', [PromotionController::class, 'show']);

// Admin routes - protected
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/admin/promotions', [PromotionController::class, 'adminIndex']);
    Route::post('/admin/promotions', [PromotionController::class, 'store']);
    Route::put('/admin/promotions/{id}', [PromotionController::class, 'update']);
    Route::delete('/admin/promotions/{id}', [PromotionController::class, 'destroy']);
    Route::patch('/admin/promotions/{id}/toggle', [PromotionController::class, 'toggleActive']);
});

// Other Public Routes (outside group)
Route::get('/nearby-drivers', [DriverProfileController::class, 'getNearbyDrivers']);
Route::get('wallet/get-receiver/{phone}', [WalletController::class, 'getReceiver']);
Route::post('/send-notification', [AdminNotificationController::class, 'send02']);
