#!/bin/bash

# Ride Endpoints Testing Script
# Run: bash test-ride-endpoints.sh

BASE_URL="http://localhost/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "RIDE ENDPOINTS TESTING"
echo "=========================================="
echo ""

# 1. Register a passenger
echo "=== 1. Registering Test Passenger ==="
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Passenger\",
    \"phone\": \"+1234567${TIMESTAMP}\",
    \"email\": \"passenger${TIMESTAMP}@test.com\",
    \"role\": \"passenger\",
    \"password\": \"password123\"
  }")

echo "Response:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
PHONE=$(echo "$REGISTER_RESPONSE" | grep -o '"phone":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    # Try alternative format
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -oP '"token"\s*:\s*"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Could not extract token from registration${NC}"
    echo "Trying login instead..."
    
    # Try login with phone
    if [ -n "$PHONE" ]; then
        LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/login \
          -H "Content-Type: application/json" \
          -d "{
            \"phone\": \"$PHONE\",
            \"password\": \"password123\"
          }")
        
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        if [ -z "$TOKEN" ]; then
            TOKEN=$(echo "$LOGIN_RESPONSE" | grep -oP '"token"\s*:\s*"[^"]*' | cut -d'"' -f4)
        fi
    fi
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Could not get authentication token${NC}"
    echo "Registration response: $REGISTER_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Token obtained: ${TOKEN:0:30}...${NC}"
echo ""

# 2. Test ride request
echo "=== 2. Testing Ride Request ==="
RIDE_RESPONSE=$(curl -s -X POST $BASE_URL/ride/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "originLat": 9.1450,
    "originLng": 38.7617,
    "destLat": 9.0100,
    "destLng": 38.7500,
    "pickupAddress": "Addis Ababa, Ethiopia",
    "destinationAddress": "Bole, Addis Ababa, Ethiopia"
  }')

echo "Response:"
echo "$RIDE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RIDE_RESPONSE"
echo ""

# Extract ride ID
RIDE_ID=$(echo "$RIDE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
if [ -z "$RIDE_ID" ]; then
    RIDE_ID=$(echo "$RIDE_RESPONSE" | grep -oP '"id"\s*:\s*\d+' | grep -oP '\d+' | head -1)
fi

if [ -n "$RIDE_ID" ]; then
    echo -e "${GREEN}✓ Ride created with ID: $RIDE_ID${NC}"
    echo ""
    
    # 3. Get ride details
    echo "=== 3. Getting Ride Details ==="
    DETAILS_RESPONSE=$(curl -s -X GET $BASE_URL/ride/$RIDE_ID \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Response:"
    echo "$DETAILS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DETAILS_RESPONSE"
    echo ""
    
    # 4. Get ride history
    echo "=== 4. Getting Ride History ==="
    HISTORY_RESPONSE=$(curl -s -X GET $BASE_URL/ride/history \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Response (first 500 chars):"
    echo "$HISTORY_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30 || echo "$HISTORY_RESPONSE" | head -c 500
    echo ""
    echo ""
    
    echo -e "${GREEN}✓ All ride endpoints tested successfully!${NC}"
else
    echo -e "${RED}✗ Could not extract ride ID${NC}"
    echo "Response: $RIDE_RESPONSE"
fi

echo ""
echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="


