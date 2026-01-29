#!/bin/bash

# Vibe Coding - Production Testing Script
# Tests all critical functionality in production

echo "🧪 Vibe Coding - Production Testing"
echo "=================================="

PROD_URL="https://vibe-coding-blue.vercel.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" "$PROD_URL$endpoint")
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} ($status_code)"
        echo "Response: $response_body"
        ((FAILED++))
        return 1
    fi
}

test_health_check() {
    echo -n "Testing Health Check... "
    
    response=$(curl -s "$PROD_URL/api/health")
    
    if echo "$response" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $response"
        ((FAILED++))
        return 1
    fi
}

test_page_load() {
    local name=$1
    local path=$2
    
    echo -n "Testing $name page load... "
    
    response=$(curl -s -w "%{http_code}" "$PROD_URL$path")
    status_code="${response: -3}"
    
    if [ "$status_code" -eq "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} ($status_code)"
        ((FAILED++))
        return 1
    fi
}

echo "🔍 Testing API Endpoints"
echo "------------------------"

test_health_check
test_endpoint "AI Generate" "/api/ai/generate" 405  # Should be POST only
test_endpoint "Support" "/api/support" 405  # Should be POST only
test_endpoint "Stripe Portal" "/api/stripe/portal" 401  # Should require auth
test_endpoint "Auth Callback" "/auth/callback" 200

echo ""
echo "🌐 Testing Page Loads"
echo "--------------------"

test_page_load "Home" "/"
test_page_load "Dashboard" "/dashboard"
test_page_load "Auth" "/auth"
test_page_load "Billing" "/billing"
test_page_load "Analytics" "/analytics"

echo ""
echo "📊 Test Results"
echo "=============="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo "✅ Production deployment is working correctly"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed${NC}"
    echo "❌ Check the failed tests above"
    exit 1
fi
