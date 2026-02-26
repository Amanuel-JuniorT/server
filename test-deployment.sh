#!/bin/bash

# ECAB App Deployment Testing Script
# Run this on your server: bash test-deployment.sh

set -e

echo "=========================================="
echo "ECAB App Deployment Test Suite"
echo "=========================================="
echo ""

APP_DIR="/var/www/ecab-app"
SERVER_IP=$(curl -s https://ipv4.icanhazip.com 2>/dev/null || echo "localhost")
PASSED=0
FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_check() {
    local test_name="$1"
    local command="$2"
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

# Detailed test function
test_check_verbose() {
    local test_name="$1"
    local command="$2"
    
    echo "Testing: $test_name..."
    if eval "$command" 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
    echo ""
}

echo "=== 1. ENVIRONMENT CHECK ==="
echo ""

test_check "App directory exists" "test -d $APP_DIR"
test_check "Current user has sudo access" "sudo -n true 2>/dev/null || sudo -v"

echo ""
echo "=== 2. DATABASE TESTS ==="
echo ""

test_check "PostgreSQL service is running" "sudo systemctl is-active postgresql"
test_check_verbose "Database connection" "cd $APP_DIR && sudo -u www-data php artisan tinker --execute=\"DB::connection()->getPdo(); echo 'Connected';\""
test_check "Migrations table exists" "sudo -u postgres psql -d ecab_db -c 'SELECT 1 FROM migrations LIMIT 1;' > /dev/null"

echo ""
echo "=== 3. MIGRATION STATUS ==="
echo ""

MIGRATION_COUNT=$(cd $APP_DIR && sudo -u www-data php artisan migrate:status 2>/dev/null | grep -c "Ran" || echo "0")
PENDING_COUNT=$(cd $APP_DIR && sudo -u www-data php artisan migrate:status 2>/dev/null | grep -c "Pending" || echo "0")

echo "Completed migrations: $MIGRATION_COUNT"
echo "Pending migrations: $PENDING_COUNT"

if [ "$PENDING_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations completed${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ $PENDING_COUNT migrations pending${NC}"
    ((FAILED++))
fi

echo ""
echo "=== 4. SERVICE STATUS ==="
echo ""

test_check "Nginx is running" "sudo systemctl is-active nginx"
test_check "PHP-FPM is running" "sudo systemctl is-active php8.2-fpm"
test_check "PostgreSQL is running" "sudo systemctl is-active postgresql"

echo ""
echo "=== 5. SUPERVISOR SERVICES ==="
echo ""

QUEUE_STATUS=$(sudo supervisorctl status ecab-queue:ecab-queue_00 2>/dev/null | grep -o "RUNNING" || echo "NOT_RUNNING")
REVERB_STATUS=$(sudo supervisorctl status ecab-reverb 2>/dev/null | grep -o "RUNNING" || echo "NOT_RUNNING")

if [ "$QUEUE_STATUS" = "RUNNING" ]; then
    echo -e "${GREEN}✓ Queue workers are running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Queue workers are not running${NC}"
    ((FAILED++))
fi

if [ "$REVERB_STATUS" = "RUNNING" ]; then
    echo -e "${GREEN}✓ Reverb WebSocket server is running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Reverb WebSocket server is not running${NC}"
    ((FAILED++))
fi

echo ""
echo "=== 6. API ENDPOINT TESTS ==="
echo ""

test_check "Test endpoint (/api/test)" "curl -s -f http://localhost/api/test | grep -q 'API is working'"
test_check "Test endpoint external IP" "curl -s -f http://$SERVER_IP/api/test | grep -q 'API is working'"

# Test public endpoints
test_check "Nearby drivers endpoint" "curl -s -f http://localhost/api/nearby-drivers > /dev/null"
test_check "Users endpoint" "curl -s -f http://localhost/api/users > /dev/null"

echo ""
echo "=== 7. FILE PERMISSIONS ==="
echo ""

test_check "Storage directory writable" "test -w $APP_DIR/storage"
test_check "Bootstrap cache writable" "test -w $APP_DIR/bootstrap/cache"
test_check "Storage symlink exists" "test -L $APP_DIR/public/storage"

OWNER=$(stat -c '%U' $APP_DIR 2>/dev/null || stat -f '%Su' $APP_DIR 2>/dev/null)
if [ "$OWNER" = "www-data" ]; then
    echo -e "${GREEN}✓ App directory owned by www-data${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ App directory owned by $OWNER (should be www-data)${NC}"
fi

echo ""
echo "=== 8. CONFIGURATION CHECK ==="
echo ""

test_check ".env file exists" "test -f $APP_DIR/.env"
test_check ".env file is secure (600)" "test $(stat -c '%a' $APP_DIR/.env 2>/dev/null || echo '000') = '600'"

# Check critical .env variables
if grep -q "DB_CONNECTION=pgsql" $APP_DIR/.env 2>/dev/null; then
    echo -e "${GREEN}✓ Database connection set to PostgreSQL${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Database connection not set to PostgreSQL${NC}"
    ((FAILED++))
fi

if grep -q "APP_ENV=production" $APP_DIR/.env 2>/dev/null; then
    echo -e "${GREEN}✓ App environment set to production${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ App environment not set to production${NC}"
fi

if grep -q "APP_DEBUG=false" $APP_DIR/.env 2>/dev/null; then
    echo -e "${GREEN}✓ Debug mode is disabled${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Debug mode may be enabled${NC}"
fi

echo ""
echo "=== 9. LOG FILES CHECK ==="
echo ""

if [ -f "$APP_DIR/storage/logs/laravel.log" ]; then
    ERROR_COUNT=$(sudo tail -n 100 $APP_DIR/storage/logs/laravel.log 2>/dev/null | grep -i "error\|exception" | wc -l || echo "0")
    if [ "$ERROR_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✓ No recent errors in Laravel log${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Found $ERROR_COUNT recent errors in Laravel log${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Laravel log file not found${NC}"
fi

if [ -f "$APP_DIR/storage/logs/queue-worker.log" ]; then
    SQLITE_ERRORS=$(sudo tail -n 50 $APP_DIR/storage/logs/queue-worker.log 2>/dev/null | grep -i "sqlite" | wc -l || echo "0")
    if [ "$SQLITE_ERRORS" -eq 0 ]; then
        echo -e "${GREEN}✓ No SQLite errors in queue worker log${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Found SQLite errors in queue worker log${NC}"
        ((FAILED++))
    fi
fi

if [ -f "$APP_DIR/storage/logs/reverb.log" ]; then
    REVERB_ERRORS=$(sudo tail -n 50 $APP_DIR/storage/logs/reverb.log 2>/dev/null | grep -i "error\|exception" | wc -l || echo "0")
    if [ "$REVERB_ERRORS" -eq 0 ]; then
        echo -e "${GREEN}✓ No errors in Reverb log${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Found $REVERB_ERRORS errors in Reverb log${NC}"
    fi
fi

echo ""
echo "=== 10. DATABASE TABLES CHECK ==="
echo ""

REQUIRED_TABLES=("users" "drivers" "rides" "wallet" "transactions" "vehicles" "payments" "jobs")
for table in "${REQUIRED_TABLES[@]}"; do
    if sudo -u postgres psql -d ecab_db -c "\dt $table" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Table '$table' exists${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Table '$table' does not exist${NC}"
        ((FAILED++))
    fi
done

echo ""
echo "=== 11. NETWORK & FIREWALL ==="
echo ""

test_check "Port 80 (HTTP) is accessible" "curl -s -f --connect-timeout 2 http://localhost > /dev/null"
test_check "Port 8080 (Reverb) is listening" "sudo lsof -i :8080 > /dev/null 2>&1 || sudo netstat -tuln | grep :8080 > /dev/null"

UFW_STATUS=$(sudo ufw status 2>/dev/null | grep -o "Status: active" || echo "inactive")
if [ "$UFW_STATUS" = "Status: active" ]; then
    echo -e "${GREEN}✓ Firewall is active${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Firewall is not active${NC}"
fi

echo ""
echo "=== 12. LARAVEL ARTISAN COMMANDS ==="
echo ""

test_check "Artisan command works" "cd $APP_DIR && sudo -u www-data php artisan --version > /dev/null"
test_check "Route list command works" "cd $APP_DIR && sudo -u www-data php artisan route:list > /dev/null 2>&1"

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED! Your deployment is solid!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
    exit 1
fi


