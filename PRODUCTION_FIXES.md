# Production API Fixes

**Server**: http://54.243.7.165  
**Date**: December 8, 2025  
**Issues Found**: 3 critical issues

---

## 🔍 Issues Identified

### 1. ❌ Missing `getUserProfile` Method in AuthManager
**Error**: "Server Error" when calling `/api/profile`  
**Cause**: Method not implemented in `AuthManager.php`  
**Impact**: Users cannot view their profile

### 2. ❌ Wallet Relationship Missing
**Error**: "Server Error" when calling `/api/wallet` and `/api/wallet/transactions`  
**Cause**: Missing relationship between User and Wallet models  
**Impact**: Wallet features not working

### 3. ❌ Wrong Parameter Names for Ride Request
**Error**: "The origin lat field is required"  
**Cause**: API expects `originLat` but test script sends `pickup_lat`  
**Impact**: Ride requests fail

---

## 🔧 Fixes Required

### Fix 1: Add getUserProfile Method

**File**: `app/Http/Controllers/AuthManager.php`  
**Action**: Add missing method

```php
public function getUserProfile(Request $request)
{
    try {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }

        // Load driver relationship if exists
        $user->load('driver');

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => $user,
                'is_active' => $user->is_active,
                'approval_state' => optional($user->driver)->approval_state,
            ],
            'message' => 'Profile retrieved successfully'
        ], 200);
    } catch (\Exception $e) {
        \Log::error('Get profile error: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to retrieve profile: ' . $e->getMessage()
        ], 500);
    }
}
```

### Fix 2: Add Wallet Relationship to User Model

**File**: `app/Models/User.php`  
**Action**: Add wallet relationship

```php
public function wallet()
{
    return $this->hasOne(Wallet::class);
}
```

### Fix 3: Update Test Script Parameter Names

**File**: `routes/test.sh`  
**Action**: Change parameter names to match API expectations

Change from:
```bash
-d "pickup_lat=9.04" \
-d "pickup_lng=38.74" \
-d "dropoff_lat=9.05" \
-d "dropoff_lng=38.76"
```

To:
```bash
-d "originLat=9.04" \
-d "originLng=38.74" \
-d "destLat=9.05" \
-d "destLng=38.76"
```

---

## 📝 Implementation Steps

### Step 1: SSH into Production Server

```bash
ssh ecab_admin@54.243.7.165
cd /var/www/ecab-app
```

### Step 2: Apply Fixes

```bash
# Backup current files
sudo cp app/Http/Controllers/AuthManager.php app/Http/Controllers/AuthManager.php.backup
sudo cp app/Models/User.php app/Models/User.php.backup

# Edit AuthManager.php
sudo nano app/Http/Controllers/AuthManager.php
# Add the getUserProfile method before the closing brace

# Edit User.php
sudo nano app/Models/User.php
# Add the wallet relationship method

# Update test script
nano routes/test.sh
# Fix parameter names
```

### Step 3: Clear Cache and Restart

```bash
# Clear all caches
sudo php artisan config:clear
sudo php artisan cache:clear
sudo php artisan route:clear

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

### Step 4: Test Again

```bash
cd /var/www/ecab-app/routes
bash test.sh
```

---

## ✅ Expected Results After Fixes

```bash
==== 4. GET USER PROFILE ====
{
    "status": "success",
    "data": {
        "user": {...},
        "is_active": true,
        "approval_state": null
    },
    "message": "Profile retrieved successfully"
}

==== 7. REQUEST RIDE ====
{
    "status": "success",
    "ride": {...},
    "message": "Ride requested successfully"
}

==== 8. WALLET INDEX ====
{
    "balance": 0
}

==== 9. WALLET TRANSACTIONS ====
[]
```

---

## 🚨 Quick Fix Commands

Run these on the production server:

```bash
# Navigate to app directory
cd /var/www/ecab-app

# Apply all fixes at once using the fix script (created below)
sudo bash fix-production-issues.sh

# Test
cd routes && bash test.sh
```
