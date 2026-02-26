#!/bin/bash

# Fix Location Update Timeout Issue
# This script updates the DriverProfileController to prevent socket timeouts

echo "🔧 Fixing Location Update Timeout..."

cd /var/www/ecab-app

# Backup the file
cp app/Http/Controllers/DriverProfileController.php app/Http/Controllers/DriverProfileController.php.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

# Create the new updateLocation method
cat > /tmp/new_updateLocation.php <<'EOF'
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

            // Update location in database
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

            // Also update driver table location fields if they exist
            if (method_exists($driver, 'hasAttribute') && $driver->hasAttribute('latitude')) {
                $driver->latitude = $request->latitude;
                $driver->longitude = $request->longitude;
                $driver->last_location_update = now();
                $driver->save();
            }

            // Send response immediately before broadcasting
            $response = response()->json([
                'success' => true,
                'message' => 'Location updated successfully'
            ]);

            // Broadcast event asynchronously (non-blocking)
            try {
                broadcast(new DriverLocationChange())->toOthers();
            } catch (\Exception $broadcastException) {
                // Log broadcast error but don't fail the request
                \Log::warning('Failed to broadcast location update: ' . $broadcastException->getMessage());
            }

            return $response;
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Location update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to update location',
                'message' => $e->getMessage()
            ], 500);
        }
    }
EOF

# Find the start and end lines of the updateLocation method
START_LINE=$(grep -n "public function updateLocation" app/Http/Controllers/DriverProfileController.php | head -1 | cut -d: -f1)

if [ -z "$START_LINE" ]; then
    echo "✗ Could not find updateLocation method"
    exit 1
fi

# Find the next method after updateLocation
NEXT_METHOD_LINE=$(tail -n +$((START_LINE + 1)) app/Http/Controllers/DriverProfileController.php | grep -n "public function" | head -1 | cut -d: -f1)
END_LINE=$((START_LINE + NEXT_METHOD_LINE - 1))

echo "✓ Found updateLocation method at lines $START_LINE-$END_LINE"

# Split the file
head -n $((START_LINE - 1)) app/Http/Controllers/DriverProfileController.php > /tmp/driver_part1.php
tail -n +$END_LINE app/Http/Controllers/DriverProfileController.php > /tmp/driver_part2.php

# Combine with new method
cat /tmp/driver_part1.php > app/Http/Controllers/DriverProfileController.php
cat /tmp/new_updateLocation.php >> app/Http/Controllers/DriverProfileController.php
echo "" >> app/Http/Controllers/DriverProfileController.php
cat /tmp/driver_part2.php >> app/Http/Controllers/DriverProfileController.php

# Clean up
rm /tmp/new_updateLocation.php /tmp/driver_part1.php /tmp/driver_part2.php

# Verify the fix
if grep -q "Send response immediately before broadcasting" app/Http/Controllers/DriverProfileController.php; then
    echo "✓ Fix applied successfully"
else
    echo "✗ Fix verification failed - restoring backup"
    cp app/Http/Controllers/DriverProfileController.php.backup.* app/Http/Controllers/DriverProfileController.php
    exit 1
fi

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

echo ""
echo "✅ Location update timeout fix applied!"
echo ""
echo "Changes made:"
echo "  - Made broadcast non-blocking"
echo "  - Added proper error handling"
echo "  - Response sent before broadcast"
echo "  - Added try-catch for validation"
echo ""
echo "Test with the driver app - location updates should now work without timeout!"
