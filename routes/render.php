<?php

use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Payment Receipts (NEW)
Route::middleware(['auth', 'verified', \App\Http\Middleware\EnsureUserIsSuperAdmin::class])->group(function () {
  Route::get('payment-receipts', function () {
    return Inertia::render('payment-receipts');
  })->name('payment-receipts');
});
