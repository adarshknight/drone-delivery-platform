#!/bin/bash

# Backend API Test Script
# Tests all REST endpoints and verifies backend functionality

echo "=================================="
echo "🚁 Drone Delivery Backend API Test"
echo "=================================="
echo ""

BASE_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo "  → $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ Success${NC} (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "  ${RED}✗ Failed${NC} (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
}

# Check if server is running
echo "1. Checking if backend server is running..."
if curl -s "$BASE_URL/api/drones" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend server is running${NC}"
else
    echo -e "${RED}✗ Backend server is not running!${NC}"
    echo "Please start the backend server with: cd backend && npm run dev"
    exit 1
fi
echo ""

# Test Drones endpoints
echo "=================================="
echo "2. Testing Drone Endpoints"
echo "=================================="
test_endpoint "GET" "/api/drones" "Get all drones"
test_endpoint "GET" "/api/drones/drone-1" "Get specific drone (drone-1)"
echo ""

# Test Orders endpoints
echo "=================================="
echo "3. Testing Order Endpoints"
echo "=================================="
test_endpoint "GET" "/api/orders" "Get all orders"

# Create a test order
order_data='{
  "restaurantId": "restaurant-1",
  "customerId": "customer-1",
  "items": [
    {"name": "Pizza", "quantity": 1, "weight": 0.5}
  ],
  "priority": "NORMAL"
}'
test_endpoint "POST" "/api/orders" "Create new order" "$order_data"
echo ""

# Test Kiosks endpoints
echo "=================================="
echo "4. Testing Kiosk Endpoints"
echo "=================================="
test_endpoint "GET" "/api/kiosks" "Get all kiosks"
test_endpoint "GET" "/api/kiosks/kiosk-1" "Get specific kiosk (kiosk-1)"
echo ""

# Test Restaurants endpoints
echo "=================================="
echo "5. Testing Restaurant Endpoints"
echo "=================================="
test_endpoint "GET" "/api/restaurants" "Get all restaurants"
test_endpoint "GET" "/api/restaurants/restaurant-1" "Get specific restaurant"
echo ""

# Test Simulation endpoints
echo "=================================="
echo "6. Testing Simulation Control"
echo "=================================="
test_endpoint "POST" "/api/simulation/start" "Start simulation"
sleep 2
test_endpoint "POST" "/api/simulation/stop" "Stop simulation"
test_endpoint "POST" "/api/simulation/start" "Restart simulation"

# Test speed control
speed_data='{"speed": 2}'
test_endpoint "PUT" "/api/simulation/speed" "Set simulation speed to 2x" "$speed_data"

# Test weather control
weather_data='{"condition": "LIGHT_RAIN", "impact": 50}'
test_endpoint "PUT" "/api/simulation/weather" "Set weather to light rain" "$weather_data"
echo ""

# Summary
echo "=================================="
echo "✅ Backend API Test Complete!"
echo "=================================="
echo ""
echo "All endpoints tested. Check results above."
echo ""
