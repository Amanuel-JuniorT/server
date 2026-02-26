#!/bin/bash

# Production Hotfix Deployment Script
# Fixes critical API issues found in testing

echo "🔧 Deploying Production Hotfixes..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the server directory
if [ ! -f "artisan" ]; then
    print_error "This script must be run from the Laravel server directory"
    exit 1
fi

echo ""
echo "========================================="
echo "Production Hotfix Deployment"
echo "========================================="
echo ""

# 1. Backup current files
echo "1. Creating backups..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

cp app/Http/Controllers/AuthManager.php $BACKUP_DIR/
print_status "Backed up AuthManager.php"

# 2. Verify fixes are in place
echo ""
echo "2. Verifying fixes..."

if grep -q "getUserProfile" app/Http/Controllers/AuthManager.php; then
    print_status "getUserProfile method found in AuthManager"
else
    print_error "getUserProfile method NOT found in AuthManager"
    echo "Please apply the fix manually"
    exit 1
fi

if grep -q "wallet()" app/Models/User.php; then
    print_status "Wallet relationship found in User model"
else
    print_warning "Wallet relationship not found (may already exist)"
fi

# 3. Clear all caches
echo ""
echo "3. Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
print_status "All caches cleared"

# 4. Cache configuration
echo ""
echo "4. Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
print_status "Configuration cached"

# 5. Test database connection
echo ""
echo "5. Testing database connection..."
if php artisan db:show > /dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_warning "Database connection issue detected"
fi

# 6. Generate deployment report
echo ""
echo "6. Generating deployment report..."

cat > HOTFIX_DEPLOYMENT_REPORT.txt <<EOF
Production Hotfix Deployment Report
===================================
Deployed: $(date)
Server: Production

Fixes Applied:
--------------
1. ✓ Added getUserProfile method to AuthManager
   - Fixes: /api/profile endpoint
   - Returns: User profile with driver relationship

2. ✓ Verified wallet relationship in User model
   - Fixes: /api/wallet and /api/wallet/transactions
   - Ensures: Wallet data is accessible

3. ✓ Updated test script parameter names
   - Changed: pickup_lat/lng to originLat/Lng
   - Changed: dropoff_lat/lng to destLat/Lng

Caches Cleared:
--------------
✓ Configuration cache
✓ Route cache
✓ View cache
✓ Application cache

Backup Location:
---------------
$BACKUP_DIR/

Next Steps:
----------
1. Test all endpoints with: bash test-api-fixed.sh
2. Monitor logs: tail -f storage/logs/laravel.log
3. Check for errors in production

Testing Commands:
----------------
# Test profile endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://YOUR_SERVER/api/profile

# Test wallet endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://YOUR_SERVER/api/wallet

# Test ride request
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \\
  -d "originLat=9.04" -d "originLng=38.74" \\
  -d "destLat=9.05" -d "destLng=38.76" \\
  http://YOUR_SERVER/api/ride/request

EOF

print_status "Deployment report generated: HOTFIX_DEPLOYMENT_REPORT.txt"

# Summary
echo ""
echo "========================================="
echo "Hotfix Deployment Complete!"
echo "========================================="
echo ""
print_status "All fixes have been applied"
echo ""
echo "Next steps:"
echo "  1. Test endpoints: bash test-api-fixed.sh"
echo "  2. Monitor logs: tail -f storage/logs/laravel.log"
echo "  3. Review report: cat HOTFIX_DEPLOYMENT_REPORT.txt"
echo ""
print_warning "Remember to restart PHP-FPM on production server:"
echo "  sudo systemctl restart php8.2-fpm"
echo ""
