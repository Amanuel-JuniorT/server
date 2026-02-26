<?php

/**
 * ARCHIVED ROUTES (Removed during optimization)
 * 
 * These routes were identified as redundant or duplicate and have been moved here
 * for reference, just in case they are needed for specific legacy purposes.
 */

use App\Http\Controllers\RideController;
use App\Http\Controllers\PassengerController;
use App\Http\Controllers\DriverProfileController;
use App\Http\Controllers\CompanyRideDriverController;
use App\Http\Controllers\CompanyAdminController;
use Illuminate\Support\Facades\Route;

// --- Redundant ride request routes (consolidated to RideController@requestRide) ---
// Route::middleware('auth:sanctum')->post('/ride', [RideController::class, 'requestRide']);
// Route::post('/request-ride', [PassengerController::class, 'requestRide']);

// --- Duplicate driver status/profile routes ---
// These were commented or duplicated in the original api.php
// Route::middleware('auth:sanctum')->post('/driver/update-status', [DriverProfileController::class, 'updateStatus']);
// Route::patch('/driver/status', [DriverProfileController::class, 'updateStatus']);

// --- Redundant Company Ride Management blocks for Drivers ---
// These were identical blocks provided twice in the original api.php
/*
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/driver/company-rides', [CompanyRideDriverController::class, 'getAssignedRides']);
    Route::get('/driver/company-rides/available', [CompanyRideDriverController::class, 'getAvailableRides']);
    Route::get('/driver/companies/available', [CompanyController::class, 'getAvailableCompanies']);
    Route::get('/driver/company-ride/active', [CompanyRideDriverController::class, 'getActiveRide']);
    Route::get('/driver/company-ride/{id}', [CompanyRideDriverController::class, 'getRide']);
    Route::post('/driver/company-ride/{id}/accept', [CompanyRideDriverController::class, 'acceptRide']);
    Route::post('/driver/company-ride/{id}/start', [CompanyRideDriverController::class, 'startRide']);
    Route::post('/driver/company-ride/{id}/complete', [CompanyRideDriverController::class, 'completeRide']);
    Route::post('/driver/company-ride/{id}/cancel', [CompanyRideDriverController::class, 'cancelRide']);
});
*/

// --- Web.php Redundancies ---
// Duplicate route for company-admin drivers
// Route::get('drivers', [CompanyAdminController::class, 'drivers'])->name('company-admin.drivers');


// --- Commented-out sections from original api.php ---
// use App\Http\Controllers\CompanyRideController;
// Route::middleware('auth:sanctum')->get('/ride/{id}/started', [RideController::class, 'startRide']);
// Route::apiResource('users', UserController::class)->only(['index', 'show', 'update', 'destroy']);
// Route::apiResource('transaction', Wallet_Controller::class)->only(['index', 'store']);
// Route::get('user/payments', ...); etc.
