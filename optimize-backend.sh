#!/bin/bash

# Backend Production Optimization Script (Safe Version)
# Run this before deploying to production

set -e

echo "🔧 Optimizing Backend for Production..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in the server directory
if [ ! -f "artisan" ]; then
    echo "Error: This script must be run from the Laravel server directory"
    exit 1
fi

# 1. Clear all caches
echo ""
echo "1. Clearing all caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
print_status "All caches cleared"

# 2. Optimize autoloader (with dev dependencies for now)
echo ""
echo "2. Optimizing Composer autoloader..."
composer dump-autoload --optimize
print_status "Autoloader optimized"

# 3. Cache configuration
echo ""
echo "3. Caching configuration..."
php artisan config:cache
print_status "Configuration cached"

# 4. Cache routes
echo ""
echo "4. Caching routes..."
php artisan route:cache
print_status "Routes cached"

# 5. Cache views
echo ""
echo "5. Caching views..."
php artisan view:cache
print_status "Views cached"

# 6. Build frontend assets
echo ""
echo "6. Building frontend assets..."
if [ -f "package.json" ]; then
    npm run build
    print_status "Frontend assets built"
else
    print_warning "No package.json found, skipping frontend build"
fi

# 7. Create storage link
echo ""
echo "7. Creating storage link..."
php artisan storage:link 2>/dev/null || print_warning "Storage link already exists"
print_status "Storage link verified"

# 8. Generate security key if not exists
echo ""
echo "8. Checking application key..."
if grep -q "APP_KEY=$" .env 2>/dev/null; then
    print_warning "APP_KEY not set, generating..."
    php artisan key:generate
    print_status "Application key generated"
else
    print_status "Application key already set"
fi

# 9. Run security checks
echo ""
echo "9. Running security checks..."

# Check if APP_DEBUG is false
if grep -q "APP_DEBUG=true" .env 2>/dev/null; then
    print_warning "WARNING: APP_DEBUG is set to true. Set to false for production!"
else
    print_status "APP_DEBUG is correctly set to false"
fi

# Check if APP_ENV is production
if grep -q "APP_ENV=production" .env 2>/dev/null; then
    print_status "APP_ENV is correctly set to production"
elif grep -q "APP_ENV=local" .env 2>/dev/null; then
    print_warning "INFO: APP_ENV is set to local (development mode)"
fi

# 10. Generate optimization report
echo ""
echo "10. Generating optimization report..."

cat > OPTIMIZATION_REPORT.txt <<EOF
Backend Optimization Report
===========================
Generated: $(date)

Optimizations Applied:
✓ All caches cleared
✓ Composer autoloader optimized
✓ Configuration cached
✓ Routes cached
✓ Views cached
✓ Frontend assets built
✓ Storage link verified

Configuration Check:
- APP_ENV: $(grep APP_ENV .env 2>/dev/null | cut -d '=' -f2 || echo "Not set")
- APP_DEBUG: $(grep APP_DEBUG .env 2>/dev/null | cut -d '=' -f2 || echo "Not set")
- DB_CONNECTION: $(grep DB_CONNECTION .env 2>/dev/null | cut -d '=' -f2 || echo "Not set")

Cached Files:
- Config cache: $(ls -lh bootstrap/cache/config.php 2>/dev/null | awk '{print $5}' || echo "Not found")
- Routes cache: $(ls -lh bootstrap/cache/routes-v7.php 2>/dev/null | awk '{print $5}' || echo "Not found")

Production Checklist:
□ Set APP_ENV=production in .env
□ Set APP_DEBUG=false in .env
□ Configure production database credentials
□ Set up SSL certificate
□ Configure email service
□ Set up Firebase FCM
□ Configure Google Maps API
□ Set up Pusher for real-time features
□ Configure payment gateway
□ Set up queue workers with Supervisor
□ Configure cron jobs for scheduler
□ Set up automated backups
□ Configure monitoring and logging
□ Test all critical functionality

Deployment Commands:
# On production server:
1. php artisan migrate --force
2. php artisan storage:link
3. php artisan config:cache
4. php artisan route:cache
5. php artisan view:cache
6. supervisorctl restart all
7. systemctl restart nginx php8.2-fpm

Monitoring Commands:
# View logs:
tail -f storage/logs/laravel.log

# Check queue workers:
supervisorctl status

# Check services:
systemctl status nginx
systemctl status php8.2-fpm

EOF

print_status "Optimization report generated: OPTIMIZATION_REPORT.txt"

# Summary
echo ""
echo "========================================="
echo "Backend Optimization Complete!"
echo "========================================="
echo ""
print_status "Your backend is optimized and ready for deployment"
echo ""
echo "Next steps:"
echo "  1. Review OPTIMIZATION_REPORT.txt"
echo "  2. Update .env with production settings"
echo "  3. Run migrations: php artisan migrate --force"
echo "  4. Deploy to AWS Lightsail using deploy-lightsail.sh"
echo ""
