#!/bin/bash

# API Endpoints Testing Script
# Run this on your server: bash test-api-endpoints.sh

BASE_URL="http://localhost/api"
SERVER_IP="54.243.7.165"  # Update with your server IP
BASE_URL_EXTERNAL="http://${SERVER_IP}/api"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

echo "=========================================="
echo "API ENDPOINTS TESTING"
echo "=========================================="
echo ""

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$endpoint" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  Response: $body" | head -c 100
        echo ""
        ((FAILED++))
        return 1
    fi
}

echo "=== 1. PUBLIC ENDPOINTS ==="
echo ""

test_endpoint "Test endpoint" "GET" "$BASE_URL/test"
test_endpoint "Nearby drivers" "GET" "$BASE_URL/nearby-drivers"
test_endpoint "Users list" "GET" "$BASE_URL/users"

echo ""
echo "=== 2. AUTHENTICATION ENDPOINTS ==="
echo ""

# Test registration
REGISTER_DATA='{"name":"Test User","email":"test'$(date +%s)'@example.com","password":"password123","phone":"+1234567890"}'
echo "Testing: User Registration... "
register_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$REGISTER_DATA" "$BASE_URL/register" 2>/dev/null)
register_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$REGISTER_DATA" "$BASE_URL/register" 2>/dev/null)

if [ "$register_code" = "201" ] || [ "$register_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $register_code)"
    ((PASSED++))
    # Extract token if available
    TOKEN=$(echo "$register_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    USER_EMAIL=$(echo "$REGISTER_DATA" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${YELLOW}⚠ Registration returned HTTP $register_code${NC}"
    # Try with existing test credentials
    USER_EMAIL="test@example.com"
fi

# Test login
LOGIN_DATA='{"email":"'$USER_EMAIL'","password":"password123"}'
echo "Testing: User Login... "
login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$BASE_URL/login" 2>/dev/null)
login_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$BASE_URL/login" 2>/dev/null)

if [ "$login_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $login_code)"
    ((PASSED++))
    # Extract token
    TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -z "$TOKEN" ]; then
        TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    fi
    echo "  Token extracted: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $login_code)"
    echo "  Response: $login_response" | head -c 200
    echo ""
    ((FAILED++))
    TOKEN=""
fi

echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠ No authentication token available. Skipping authenticated endpoints.${NC}"
    echo ""
    echo "To test authenticated endpoints, you need to:"
    echo "1. Register a user: curl -X POST $BASE_URL/register -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"email\":\"test@example.com\",\"password\":\"password123\"}'"
    echo "2. Login: curl -X POST $BASE_URL/login -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'"
    echo "3. Use the token in Authorization header: Authorization: Bearer <token>"
    echo ""
else
    echo "=== 3. AUTHENTICATED ENDPOINTS (with token) ==="
    echo ""
    
    AUTH_HEADER="Authorization: Bearer $TOKEN"
    
    # Test profile
    echo "Testing: Get User Profile... "
    profile_code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/profile" 2>/dev/null)
    if [ "$profile_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $profile_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $profile_code)"
        ((FAILED++))
    fi
    
    # Test ride request
    RIDE_DATA='{
        "originLat": 9.1450,
        "originLng": 38.7617,
        "destLat": 9.0100,
        "destLng": 38.7500,
        "pickupAddress": "Addis Ababa, Ethiopia",
        "destinationAddress": "Bole, Addis Ababa, Ethiopia"
    }'
    
    echo "Testing: Request Ride... "
    ride_response=$(curl -s -X POST -H "Content-Type: application/json" -H "$AUTH_HEADER" -d "$RIDE_DATA" "$BASE_URL/ride/request" 2>/dev/null)
    ride_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -H "$AUTH_HEADER" -d "$RIDE_DATA" "$BASE_URL/ride/request" 2>/dev/null)
    
    if [ "$ride_code" = "201" ] || [ "$ride_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $ride_code)"
        ((PASSED++))
        # Extract ride ID
        RIDE_ID=$(echo "$ride_response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        if [ -z "$RIDE_ID" ]; then
            RIDE_ID=$(echo "$ride_response" | grep -o 'ride.*"id":[0-9]*' | head -1 | grep -o '[0-9]*' | head -1)
        fi
        echo "  Ride ID: $RIDE_ID"
        echo "  Response preview: $(echo "$ride_response" | head -c 150)..."
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $ride_code)"
        echo "  Response: $ride_response" | head -c 200
        echo ""
        ((FAILED++))
        RIDE_ID=""
    fi
    
    echo ""
    
    if [ -n "$RIDE_ID" ]; then
        echo "=== 4. RIDE MANAGEMENT ENDPOINTS ==="
        echo ""
        
        # Get ride details
        echo "Testing: Get Ride Details... "
        details_code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/ride/$RIDE_ID" 2>/dev/null)
        if [ "$details_code" = "200" ]; then
            echo -e "${GREEN}✓ PASSED${NC} (HTTP $details_code)"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC} (HTTP $details_code)"
            ((FAILED++))
        fi
        
        # Ride history
        echo "Testing: Get Ride History... "
        history_code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/ride/history" 2>/dev/null)
        if [ "$history_code" = "200" ]; then
            echo -e "${GREEN}✓ PASSED${NC} (HTTP $history_code)"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC} (HTTP $history_code)"
            ((FAILED++))
        fi
        
        echo ""
    fi
    
    echo "=== 5. WALLET ENDPOINTS ==="
    echo ""
    
    # Wallet endpoints
    echo "Testing: Get Wallet... "
    wallet_code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/wallet" 2>/dev/null)
    if [ "$wallet_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $wallet_code)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Wallet endpoint returned HTTP $wallet_code${NC}"
    fi
    
    echo "Testing: Get Wallet Transactions... "
    transactions_code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_HEADER" "$BASE_URL/wallet/transactions" 2>/dev/null)
    if [ "$transactions_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $transactions_code)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Transactions endpoint returned HTTP $transactions_code${NC}"
    fi
    
    echo ""
fi

echo "=== 6. EXTERNAL ACCESS TEST ==="
echo ""

# Test external access
echo "Testing: External API access... "
external_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL_EXTERNAL/test" 2>/dev/null)
if [ "$external_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $external_code) - API accessible from external IP"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ External access returned HTTP $external_code${NC}"
    echo "  (This might be normal if firewall restricts access)"
fi

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Review the output above.${NC}"
    exit 1
fi


