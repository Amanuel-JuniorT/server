#!/bin/bash

# Common Issues Fix Script
# Run: bash fix-common-issues.sh

APP_DIR="/var/www/ecab-app"

echo "=== Fixing Common Issues ==="
echo ""

# 1. Fix permissions
echo "1. Fixing permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR
sudo chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache
sudo chmod 600 $APP_DIR/.env
echo "  ✓ Permissions fixed"
echo ""

# 2. Clear caches
echo "2. Clearing caches..."
cd $APP_DIR
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan cache:clear
sudo -u www-data php artisan route:clear
sudo -u www-data php artisan view:clear
sudo rm -rf bootstrap/cache/*
echo "  ✓ Caches cleared"
echo ""

# 3. Ensure storage link exists
echo "3. Checking storage link..."
if [ ! -L "$APP_DIR/public/storage" ]; then
    sudo -u www-data php artisan storage:link
    echo "  ✓ Storage link created"
else
    echo "  ✓ Storage link exists"
fi
echo ""

# 4. Check .env configuration
echo "4. Checking .env configuration..."
if ! grep -q "CACHE_STORE=file" $APP_DIR/.env 2>/dev/null; then
    echo "CACHE_STORE=file" | sudo tee -a $APP_DIR/.env > /dev/null
    echo "  ✓ Added CACHE_STORE"
fi

if ! grep -q "CACHE_DRIVER=file" $APP_DIR/.env 2>/dev/null; then
    echo "CACHE_DRIVER=file" | sudo tee -a $APP_DIR/.env > /dev/null
    echo "  ✓ Added CACHE_DRIVER"
fi

if ! grep -q "SESSION_DRIVER=database" $APP_DIR/.env 2>/dev/null; then
    echo "SESSION_DRIVER=database" | sudo tee -a $APP_DIR/.env > /dev/null
    echo "  ✓ Added SESSION_DRIVER"
fi
echo ""

# 5. Restart services
echo "5. Restarting services..."
sudo supervisorctl restart all
sudo systemctl reload php8.2-fpm
sudo systemctl reload nginx
echo "  ✓ Services restarted"
echo ""

# 6. Check logs directory
echo "6. Ensuring logs directory exists..."
sudo mkdir -p $APP_DIR/storage/logs
sudo chown -R www-data:www-data $APP_DIR/storage/logs
sudo chmod -R 775 $APP_DIR/storage/logs
echo "  ✓ Logs directory ready"
echo ""

echo "=== Fixes Complete ==="
echo ""
echo "Run 'bash health-check.sh' to verify everything is working."


