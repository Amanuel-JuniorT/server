#!/bin/bash

# Quick Health Check Script
# Run: bash health-check.sh

APP_DIR="/var/www/ecab-app"

echo "=== Quick Health Check ==="
echo ""

# Services
echo "Services:"
sudo systemctl is-active nginx && echo "  ✓ Nginx" || echo "  ✗ Nginx"
sudo systemctl is-active php8.2-fpm && echo "  ✓ PHP-FPM" || echo "  ✗ PHP-FPM"
sudo systemctl is-active postgresql && echo "  ✓ PostgreSQL" || echo "  ✗ PostgreSQL"
echo ""

# Supervisor
echo "Supervisor Services:"
sudo supervisorctl status | grep -E "RUNNING|STOPPED" | while read line; do
    if echo "$line" | grep -q "RUNNING"; then
        echo "  ✓ $(echo $line | awk '{print $1}')"
    else
        echo "  ✗ $(echo $line | awk '{print $1}')"
    fi
done
echo ""

# Database
echo "Database:"
cd $APP_DIR && sudo -u www-data php artisan tinker --execute="echo '  ' . (DB::connection()->getPdo() ? '✓ Connected' : '✗ Failed');" 2>/dev/null || echo "  ✗ Connection failed"
echo ""

# Migrations
PENDING=$(cd $APP_DIR && sudo -u www-data php artisan migrate:status 2>/dev/null | grep -c "Pending" || echo "0")
if [ "$PENDING" -eq "0" ]; then
    echo "Migrations: ✓ All complete"
else
    echo "Migrations: ✗ $PENDING pending"
fi
echo ""

# API
echo "API:"
if curl -s http://localhost/api/test | grep -q "API is working"; then
    echo "  ✓ API responding"
else
    echo "  ✗ API not responding"
fi
echo ""

# Logs
echo "Recent Errors:"
LARAVEL_ERRORS=$(sudo tail -n 50 $APP_DIR/storage/logs/laravel.log 2>/dev/null | grep -i "error\|exception" | wc -l || echo "0")
QUEUE_ERRORS=$(sudo tail -n 50 $APP_DIR/storage/logs/queue-worker.log 2>/dev/null | grep -i "error\|sqlite" | wc -l || echo "0")
echo "  Laravel log: $LARAVEL_ERRORS errors"
echo "  Queue log: $QUEUE_ERRORS errors"
echo ""

echo "=== Health Check Complete ==="


