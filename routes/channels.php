<?php

use App\Models\Admin;
use Illuminate\Support\Facades\Broadcast;
use App\Models\Ride;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('drivers', function ($user) {
    return $user->role === 'driver';
});

Broadcast::channel('driver.location.{driverId}', function ($user, $driverId) {
    // Authorized Admins can track any driver
    $admin = Admin::find($user->id);
    if ($admin) return true;

    if ($user->driver && (int) $user->driver->id === (int) $driverId) {
        return true;
    }

    // Check company rides
    $isCompanyMember = \App\Models\CompanyRideGroupAssignment::where('driver_id', $driverId)
        ->whereIn('status', ['accepted', 'active'])
        ->whereHas('rideGroup.members', function ($q) use ($user) {
            $q->where('employee_id', $user->id);
        })->exists();

    if ($isCompanyMember) return true;

    // Check regular rides
    return \App\Models\Ride::where('driver_id', $driverId)
        ->where('passenger_id', $user->id)
        ->whereIn('status', ['accepted', 'started', 'arrived', 'in_progress'])
        ->exists();
});

Broadcast::channel('admin', function ($user) {
    return Admin::find($user->id) !== null;
});

Broadcast::channel('passenger.{id}', function ($user, $id) {
    if ((int) $user->id === (int) $id) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => 'passenger'];
    }
    return false;
});

// Consolidated driver channel below at line 92 (now moved up for clarity)
Broadcast::channel('driver.{driverId}', function ($user, $driverId) {
    // Both User (role=driver) and Driver models can authenticate.
    // Return user info if successful (enables presence features if needed)
    if ((int) $user->id === (int) $driverId || ($user->driver && (int) $user->driver->id === (int) $driverId)) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => 'driver'];
    }
    return false;
});

Broadcast::channel('drivers_online', function ($user) {
    if ($user->role === 'driver') {
        return ['id' => $user->id, 'name' => $user->name];
    }
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('ride', function ($user) {
    return $user->role === 'driver';
});

Broadcast::channel('ride.{rideId}', function ($user, $rideId) {
    $ride = Ride::find($rideId);
    return $ride && (
        (int) $user->id === (int) $ride->passenger_id ||
        (int) $user->id === (int) $ride->driver_id
    );
});

Broadcast::channel('private-accept.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id; // Only that user can listen
});

Broadcast::channel('nearby', function ($user) {
    return $user->role === 'driver';
});

Broadcast::channel('response', function ($user) {
    return in_array($user->role, ['driver', 'passenger']);
});

Broadcast::channel('driver.{driverId}', function ($user, $driverId) {
    // Both User (role=driver) and Driver models can authenticate
    return (int) $user->id === (int) $driverId || ($user->driver && (int) $user->driver->id === (int) $driverId);
});

Broadcast::channel('company.{companyId}', function ($user, $companyId) {
    // Check if user is an Admin model (from admins table)
    $admin = Admin::find($user->id);
    if ($admin) {
        // Super admin can access all companies
        if ($admin->isSuperAdmin()) {
            return true;
        }
        // Company admin can only access their own company
        if ($admin->isCompanyAdmin() && $admin->company_id == $companyId) {
            return true;
        }
    }

    // Check if user is a User model with company_admin role
    if (isset($user->role) && $user->role === 'company_admin' && isset($user->company_id) && $user->company_id == $companyId) {
        return true;
    }

    return false;
});
