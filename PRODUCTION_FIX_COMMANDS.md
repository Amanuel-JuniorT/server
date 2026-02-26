# Production Server Quick Fix Guide

## Copy-Paste Commands for SSH Session

**Current Location**: `ecab_admin@ip-172-26-3-202:/var/www/ecab-app`

---

## Method 1: Automated Fix (Recommended)

Copy and paste these commands one by one:

```bash
# Step 1: Create the fix script
cat > apply-fix.sh <<'SCRIPT_END'
#!/bin/bash
echo "🔧 Applying getUserProfile Fix..."
cp app/Http/Controllers/AuthManager.php app/Http/Controllers/AuthManager.php.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

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

LOGOUT_LINE=$(grep -n "public function logout" app/Http/Controllers/AuthManager.php | cut -d: -f1)
if [ -z "$LOGOUT_LINE" ]; then
    echo "✗ Could not find logout method"
    exit 1
fi

head -n $((LOGOUT_LINE - 1)) app/Http/Controllers/AuthManager.php > /tmp/authmanager_part1.php
tail -n +$LOGOUT_LINE app/Http/Controllers/AuthManager.php > /tmp/authmanager_part2.php

cat /tmp/authmanager_part1.php > app/Http/Controllers/AuthManager.php
cat /tmp/getUserProfile_method.txt >> app/Http/Controllers/AuthManager.php
cat /tmp/authmanager_part2.php >> app/Http/Controllers/AuthManager.php

if grep -q "getUserProfile" app/Http/Controllers/AuthManager.php; then
    echo "✓ Fix applied successfully!"
else
    echo "✗ Fix failed - restoring backup"
    cp app/Http/Controllers/AuthManager.php.backup.* app/Http/Controllers/AuthManager.php
    exit 1
fi

rm -f /tmp/getUserProfile_method.txt /tmp/authmanager_part1.php /tmp/authmanager_part2.php
echo "✅ Done! Now run: php artisan config:clear && sudo systemctl restart php8.2-fpm"
SCRIPT_END

# Step 2: Make it executable and run
chmod +x apply-fix.sh
bash apply-fix.sh

# Step 3: Clear caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Step 4: Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Step 5: Test the fix
cd routes
bash test.sh
```

---

## Method 2: Manual Edit (If automated fails)

```bash
# Step 1: Backup the file
cp app/Http/Controllers/AuthManager.php app/Http/Controllers/AuthManager.php.backup

# Step 2: Edit the file
nano app/Http/Controllers/AuthManager.php

# Step 3: Find the logout() method (around line 140)
# Press Ctrl+W to search, type "public function logout"

# Step 4: Add this method BEFORE the logout() method:
```

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

```bash
# Step 5: Save and exit
# Press Ctrl+X, then Y, then Enter

# Step 6: Verify the fix
grep -n "getUserProfile" app/Http/Controllers/AuthManager.php

# Step 7: Clear caches and restart
php artisan config:clear
php artisan cache:clear
php artisan route:clear
sudo systemctl restart php8.2-fpm

# Step 8: Test
cd routes
bash test.sh
```

---

## Method 3: Upload from Local (Alternative)

If you prefer to upload the fixed file from your local machine:

**On your local machine:**
```bash
cd /home/bekikusha/programs/Android/ECAB_App/server

# Upload the fixed file
scp app/Http/Controllers/AuthManager.php ecab_admin@54.243.7.165:/tmp/

# SSH to server
ssh ecab_admin@54.243.7.165
```

**On the server:**
```bash
cd /var/www/ecab-app

# Backup current file
cp app/Http/Controllers/AuthManager.php app/Http/Controllers/AuthManager.php.backup

# Copy the new file
cp /tmp/AuthManager.php app/Http/Controllers/

# Clear caches and restart
php artisan config:clear
php artisan cache:clear
php artisan route:clear
sudo systemctl restart php8.2-fpm

# Test
cd routes
bash test.sh
```

---

## Verification

After applying the fix, you should see:

```bash
✓ getUserProfile method found in AuthManager
```

When you run `bash deploy.sh` again.

And when you test:

```bash
cd routes
bash test.sh
```

The profile endpoint should return:
```json
{
    "status": "success",
    "data": {
        "user": {...},
        "is_active": true,
        "approval_state": null
    },
    "message": "Profile retrieved successfully"
}
```

---

## If Something Goes Wrong

Restore from backup:
```bash
cp app/Http/Controllers/AuthManager.php.backup app/Http/Controllers/AuthManager.php
sudo systemctl restart php8.2-fpm
```

---

## Quick Test After Fix

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://54.243.7.165/api/login \
  -d "phone=0912345678" \
  -d "password=password" | \
  sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# Test profile endpoint
curl -H "Authorization: Bearer $TOKEN" http://54.243.7.165/api/profile

# Should return success with user data
```
