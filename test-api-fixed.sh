#!/bin/bash

# ECAB Production API Test Script (Fixed)
# Updated parameter names to match API expectations

BASE_URL="http://54.243.7.165/api"

echo "==== 1. TEST API HEALTH ===="
curl -s $BASE_URL/test
echo -e "\n"

echo "==== 2. REGISTER TEST USER ===="
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/register \
  -H "Accept: application/json" \
  -d "name=Test User 2" \
  -d "email=testuser2@example.com" \
  -d "phone=0912345679" \
  -d "password=password" \
  -d "role=passenger")

echo $REGISTER_RESPONSE
echo -e "\n"

echo "==== 3. LOGIN ===="
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/login \
  -H "Accept: application/json" \
  -d "phone=0912345678" \
  -d "password=password")

echo $LOGIN_RESPONSE

TOKEN=$(echo $LOGIN_RESPONSE | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

echo -e "\n🔑 TOKEN: $TOKEN\n"

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo "==== 4. GET USER PROFILE ===="
curl -s -X GET $BASE_URL/profile \
  -H "Accept: application/json" \
  -H "$AUTH_HEADER"
echo -e "\n"

echo "==== 5. DRIVER APPROVAL STATUS ===="
curl -s -X GET $BASE_URL/driver/approval_status \
  -H "Accept: application/json" \
  -H "$AUTH_HEADER"
echo -e "\n"

echo "==== 6. NEARBY DRIVERS ===="
curl -s -X GET "$BASE_URL/nearby-drivers?lat=9.04&lng=38.74" \
  -H "Accept: application/json"
echo -e "\n"

echo "==== 7. REQUEST RIDE (FIXED PARAMETERS) ===="
RIDE_RESPONSE=$(curl -s -X POST $BASE_URL/ride/request \
  -H "Accept: application/json" \
  -H "$AUTH_HEADER" \
  -d "originLat=9.04" \
  -d "originLng=38.74" \
  -d "destLat=9.05" \
  -d "destLng=38.76")

echo $RIDE_RESPONSE
echo -e "\n"

# Extract ride ID if successful
RIDE_ID=$(echo $RIDE_RESPONSE | sed -n 's/.*"id":\([0-9]*\).*/\1/p')

if [ ! -z "$RIDE_ID" ]; then
    echo "✅ Ride created with ID: $RIDE_ID"
    echo -e "\n"
    
    echo "==== 8. GET RIDE DETAILS ===="
    curl -s -X GET $BASE_URL/ride/$RIDE_ID \
      -H "Accept: application/json" \
      -H "$AUTH_HEADER"
    echo -e "\n"
fi

echo "==== 9. WALLET INDEX ===="
curl -s -X GET $BASE_URL/wallet \
  -H "Accept: application/json" \
  -H "$AUTH_HEADER"
echo -e "\n"

echo "==== 10. WALLET TRANSACTIONS ===="
curl -s -X GET $BASE_URL/wallet/transactions \
  -H "Accept: application/json" \
  -H "$AUTH_HEADER"
echo -e "\n"

echo "==== 11. RIDE HISTORY ===="
curl -s -X GET $BASE_URL/ride/history \
  -H "Accept: application/json" \
  -H "$AUTH_HEADER"
echo -e "\n"

echo "==== TEST COMPLETE ===="
echo "✅ All endpoints tested"
