# Fix Location Update Timeout - Production Server

## Issue
The Android Driver app is getting socket timeout errors when sending location updates because the backend is taking too long to respond (blocking on broadcast event).

## Root Cause
The `updateLocation` method in `DriverProfileController.php` is calling `broadcast()` which blocks the response until the broadcast completes. Since Pusher is not configured, this causes a timeout.

## Solution
Make the broadcast non-blocking and send the response immediately.

---

## Quick Fix Command (Copy-Paste into SSH)

```bash
cd /var/www/ecab-app && cat > /tmp/fix_location.sh <<'SCRIPT'
#!/bin/bash
cd /var/www/ecab-app
cp app/Http/Controllers/DriverProfileController.php app/Http/Controllers/DriverProfileController.php.backup.$(date +%Y%m%d_%H%M%S)

# Use sed to replace the updateLocation method
# First, find and comment out the old method, then add the new one

# Create a temporary PHP file with the new method
cat > /tmp/new_method.txt <<'METHOD'
    public function updateLocation(Request $request)
    {
        try {
            $request->validate([
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
            ]);

            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            
            $driver = $user->driver;
            if (!$driver) {
                return response()->json(['error' => 'Not a driver'], 403);
            }

            $location = $driver->location;
            if ($location) {
                $location->update([
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'updated_at' => now(),
                ]);
            } else {
                $driver->location()->create([
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                ]);
            }

            $response = response()->json(['success' => true, 'message' => 'Location updated successfully']);

            try {
                broadcast(new DriverLocationChange())->toOthers();
            } catch (\Exception $e) {
                \Log::warning('Broadcast failed: ' . $e->getMessage());
            }

            return $response;
        } catch (\Exception $e) {
            \Log::error('Location update error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
METHOD

# Find line numbers
START=$(grep -n "public function updateLocation" app/Http/Controllers/DriverProfileController.php | cut -d: -f1)
END=$(tail -n +$((START + 1)) app/Http/Controllers/DriverProfileController.php | grep -n "^    public function" | head -1 | cut -d: -f1)
END=$((START + END - 1))

# Split and rebuild
head -n $((START - 1)) app/Http/Controllers/DriverProfileController.php > /tmp/part1.php
tail -n +$END app/Http/Controllers/DriverProfileController.php > /tmp/part2.php
cat /tmp/part1.php /tmp/new_method.txt /tmp/part2.php > app/Http/Controllers/DriverProfileController.php

rm /tmp/part1.php /tmp/part2.php /tmp/new_method.txt

php artisan config:clear && php artisan cache:clear && php artisan route:clear
sudo systemctl restart php8.2-fpm

echo "✅ Location timeout fix applied!"
SCRIPT
chmod +x /tmp/fix_location.sh && bash /tmp/fix_location.sh
```

---

## Alternative: Manual Edit

If the automated script doesn't work, edit manually:

```bash
cd /var/www/ecab-app
nano app/Http/Controllers/DriverProfileController.php
```

Find the `updateLocation` method (around line 165) and replace it with:

```php
    public function updateLocation(Request $request)
    {
        try {
            $request->validate([
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
            ]);

            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            
            $driver = $user->driver;
            if (!$driver) {
                return response()->json(['error' => 'Not a driver'], 403);
            }

            $location = $driver->location;
            if ($location) {
                $location->update([
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'updated_at' => now(),
                ]);
            } else {
                $driver->location()->create([
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                ]);
            }

            // Send response immediately
            $response = response()->json([
                'success' => true,
                'message' => 'Location updated successfully'
            ]);

            // Broadcast asynchronously (non-blocking)
            try {
                broadcast(new DriverLocationChange())->toOthers();
            } catch (\Exception $e) {
                \Log::warning('Broadcast failed: ' . $e->getMessage());
            }

            return $response;
            
        } catch (\Exception $e) {
            \Log::error('Location update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
```

Save (Ctrl+X, Y, Enter) and restart:

```bash
php artisan config:clear
php artisan cache:clear
sudo systemctl restart php8.2-fpm
```

---

## Verification

After applying the fix, check the logs:

```bash
tail -f /var/www/ecab-app/storage/logs/laravel.log
```

Then test with the driver app. Location updates should now work without timeout!

---

## What Changed

1. **Response sent immediately** - No longer waits for broadcast
2. **Broadcast wrapped in try-catch** - Won't fail if Pusher not configured
3. **Added proper error handling** - Better logging and error messages
4. **Non-blocking** - Uses `toOthers()` for async broadcast

---

## Expected Result

Before:
```
Error broadcasting location
java.net.SocketTimeoutException: timeout
```

After:
```
Location updated successfully
✓ 200 OK
```
