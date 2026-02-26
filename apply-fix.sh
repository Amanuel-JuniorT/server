#!/bin/bash

# Quick Fix Script - Add getUserProfile Method
# Run this on the production server

echo "🔧 Applying getUserProfile Fix..."

# Backup original file
cp app/Http/Controllers/AuthManager.php app/Http/Controllers/AuthManager.php.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

# Create the new method content
cat > /tmp/getUserProfile_method.txt <<'EOF'

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
EOF

# Insert the method before the logout method
# Find the line number of the logout method
LOGOUT_LINE=$(grep -n "public function logout" app/Http/Controllers/AuthManager.php | cut -d: -f1)

if [ -z "$LOGOUT_LINE" ]; then
    echo "✗ Could not find logout method"
    exit 1
fi

echo "✓ Found logout method at line $LOGOUT_LINE"

# Split the file and insert the new method
head -n $((LOGOUT_LINE - 1)) app/Http/Controllers/AuthManager.php > /tmp/authmanager_part1.php
tail -n +$LOGOUT_LINE app/Http/Controllers/AuthManager.php > /tmp/authmanager_part2.php

# Combine the parts
cat /tmp/authmanager_part1.php > app/Http/Controllers/AuthManager.php
cat /tmp/getUserProfile_method.txt >> app/Http/Controllers/AuthManager.php
cat /tmp/authmanager_part2.php >> app/Http/Controllers/AuthManager.php

echo "✓ Method added successfully"

# Verify the fix
if grep -q "getUserProfile" app/Http/Controllers/AuthManager.php; then
    echo "✓ Verification successful - getUserProfile method is present"
else
    echo "✗ Verification failed - restoring backup"
    cp app/Http/Controllers/AuthManager.php.backup.* app/Http/Controllers/AuthManager.php
    exit 1
fi

# Clean up temp files
rm -f /tmp/getUserProfile_method.txt /tmp/authmanager_part1.php /tmp/authmanager_part2.php

echo ""
echo "✅ Fix applied successfully!"
echo ""
echo "Next steps:"
echo "  1. Clear caches: php artisan config:clear && php artisan cache:clear"
echo "  2. Restart PHP-FPM: sudo systemctl restart php8.2-fpm"
echo "  3. Test: bash routes/test.sh"
