#!/bin/bash

###############################################################################
# Artopus Security Test Suite
# This script performs automated security testing on the Artopus API
#
# Usage: ./security-test-suite.sh [API_BASE_URL]
# Example: ./security-test-suite.sh http://localhost:5000
#
# NOTE: This is for TESTING PURPOSES ONLY on authorized systems
###############################################################################

set -e

# Configuration
API_BASE="${1:-http://localhost:5000}"
RESULTS_FILE="security-test-results-$(date +%Y%m%d-%H%M%S).txt"
PASSED=0
FAILED=0
WARNING=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNING++))
}

# Initialize results file
echo "Artopus Security Test Results" > "$RESULTS_FILE"
echo "Date: $(date)" >> "$RESULTS_FILE"
echo "Target: $API_BASE" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"

log_header "Starting Security Assessment"
echo "Target API: $API_BASE"

###############################################################################
# 1. AUTHENTICATION TESTS
###############################################################################
log_header "1. AUTHENTICATION & SESSION TESTS"

# Test 1.1: Login with empty credentials
log_test "1.1 - Empty credentials rejection"
RESPONSE=$(curl -s -X POST "$API_BASE/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":""}' \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ]; then
    log_pass "Empty credentials properly rejected (400)"
else
    log_fail "Expected 400, got $HTTP_CODE"
fi

# Test 1.2: SQL Injection in email
log_test "1.2 - SQL injection in email field"
RESPONSE=$(curl -s -X POST "$API_BASE/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'\'' OR '\''1'\''='\''1","password":"test"}' \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    log_pass "SQL injection properly rejected"
else
    log_fail "SQL injection not properly handled (HTTP $HTTP_CODE)"
fi

# Test 1.3: Access protected endpoint without token
log_test "1.3 - Protected endpoint without token"
RESPONSE=$(curl -s -X GET "$API_BASE/api/users/profile" \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    log_pass "Unauthorized access properly blocked (401)"
else
    log_fail "Expected 401, got $HTTP_CODE"
fi

# Test 1.4: Invalid token
log_test "1.4 - Invalid token rejection"
RESPONSE=$(curl -s -X GET "$API_BASE/api/users/profile" \
  -H "Authorization: Bearer invalid.token.here" \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    log_pass "Invalid token properly rejected (401)"
else
    log_fail "Expected 401, got $HTTP_CODE"
fi

# Test 1.5: Check CORS headers
log_test "1.5 - CORS configuration check"
CORS_HEADER=$(curl -s -I "$API_BASE/" | grep -i "access-control-allow-origin" || echo "")
if [ -z "$CORS_HEADER" ]; then
    log_warn "No CORS header found (might be set in middleware)"
elif echo "$CORS_HEADER" | grep -q "\*"; then
    log_fail "CORS allows all origins (*) - SECURITY RISK"
else
    log_pass "CORS header found: $CORS_HEADER"
fi

###############################################################################
# 2. INPUT VALIDATION TESTS
###############################################################################
log_header "2. INPUT VALIDATION & INJECTION TESTS"

# Test 2.1: XSS in artist name
log_test "2.1 - XSS payload in artist name"
XSS_PAYLOAD='<script>alert("XSS")</script>'
RESPONSE=$(curl -s -X POST "$API_BASE/api/artists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-token" \
  -d "{\"name\":\"$XSS_PAYLOAD\",\"contact\":{\"email\":\"test@test.com\"}}" \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
if echo "$BODY" | grep -q "$XSS_PAYLOAD"; then
    log_fail "XSS payload stored unsanitized"
elif [ "$HTTP_CODE" = "401" ]; then
    log_warn "Cannot test - authentication required (expected for this endpoint)"
else
    log_pass "XSS payload handled (HTTP $HTTP_CODE)"
fi

# Test 2.2: NoSQL injection in search
log_test "2.2 - NoSQL injection in search parameter"
RESPONSE=$(curl -s -X GET "$API_BASE/api/artworks?search={%22\$gt%22:%22%22}" \
  -H "Authorization: Bearer dummy-token" \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    log_warn "Cannot test - authentication required"
elif [ "$HTTP_CODE" = "400" ]; then
    log_pass "NoSQL injection rejected (400)"
else
    log_warn "NoSQL injection may be vulnerable (HTTP $HTTP_CODE)"
fi

# Test 2.3: Invalid MongoDB ObjectID
log_test "2.3 - Invalid MongoDB ObjectID handling"
RESPONSE=$(curl -s -X GET "$API_BASE/api/artists/not-a-valid-id" \
  -H "Authorization: Bearer dummy-token" \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
if [ "$HTTP_CODE" = "401" ]; then
    log_warn "Cannot test - authentication required"
elif echo "$BODY" | grep -qi "cast.*objectid"; then
    log_fail "MongoDB error exposed in response"
elif [ "$HTTP_CODE" = "400" ]; then
    log_pass "Invalid ID properly rejected (400)"
else
    log_warn "Unexpected response (HTTP $HTTP_CODE)"
fi

# Test 2.4: Path traversal in ID parameter
log_test "2.4 - Path traversal attempt"
RESPONSE=$(curl -s -X GET "$API_BASE/api/artists/../../../../etc/passwd" \
  -H "Authorization: Bearer dummy-token" \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "404" ]; then
    log_pass "Path traversal blocked (HTTP $HTTP_CODE)"
else
    log_warn "Unexpected response to path traversal (HTTP $HTTP_CODE)"
fi

# Test 2.5: Very long input
log_test "2.5 - Extremely long input handling"
LONG_STRING=$(python3 -c "print('A' * 100000)" 2>/dev/null || perl -e "print 'A' x 100000")
RESPONSE=$(curl -s -X POST "$API_BASE/api/artists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-token" \
  -d "{\"name\":\"$LONG_STRING\",\"contact\":{\"email\":\"test@test.com\"}}" \
  --max-time 5 \
  -w "\n%{http_code}" 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if echo "$HTTP_CODE" | grep -q "413"; then
    log_pass "Large payload rejected (413)"
elif echo "$HTTP_CODE" | grep -q "400"; then
    log_pass "Large payload handled (400)"
elif echo "$HTTP_CODE" | grep -q "timeout"; then
    log_fail "Request timeout - possible DoS vulnerability"
else
    log_warn "Large payload response: HTTP $HTTP_CODE"
fi

# Test 2.6: Email validation
log_test "2.6 - Invalid email format rejection"
RESPONSE=$(curl -s -X POST "$API_BASE/api/artists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-token" \
  -d '{"name":"Test Artist","contact":{"email":"invalid-email"}}' \
  -w "\n%{http_code}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    log_pass "Invalid email rejected (HTTP $HTTP_CODE)"
else
    log_warn "Invalid email handling unclear (HTTP $HTTP_CODE)"
fi

###############################################################################
# 3. SECURITY HEADERS TESTS
###############################################################################
log_header "3. SECURITY HEADERS TESTS"

# Test 3.1: Content-Security-Policy
log_test "3.1 - Content-Security-Policy header"
CSP_HEADER=$(curl -s -I "$API_BASE/" | grep -i "content-security-policy" || echo "")
if [ -z "$CSP_HEADER" ]; then
    log_fail "Missing Content-Security-Policy header"
else
    log_pass "CSP header found: $CSP_HEADER"
fi

# Test 3.2: X-Frame-Options
log_test "3.2 - X-Frame-Options header"
XFO_HEADER=$(curl -s -I "$API_BASE/" | grep -i "x-frame-options" || echo "")
if [ -z "$XFO_HEADER" ]; then
    log_fail "Missing X-Frame-Options header"
else
    log_pass "X-Frame-Options found: $XFO_HEADER"
fi

# Test 3.3: X-Content-Type-Options
log_test "3.3 - X-Content-Type-Options header"
XCTO_HEADER=$(curl -s -I "$API_BASE/" | grep -i "x-content-type-options" || echo "")
if [ -z "$XCTO_HEADER" ]; then
    log_fail "Missing X-Content-Type-Options header"
else
    log_pass "X-Content-Type-Options found: $XCTO_HEADER"
fi

# Test 3.4: Strict-Transport-Security
log_test "3.4 - Strict-Transport-Security header"
HSTS_HEADER=$(curl -s -I "$API_BASE/" | grep -i "strict-transport-security" || echo "")
if [ -z "$HSTS_HEADER" ]; then
    log_warn "Missing Strict-Transport-Security header (expected in production)"
else
    log_pass "HSTS found: $HSTS_HEADER"
fi

# Test 3.5: X-XSS-Protection
log_test "3.5 - X-XSS-Protection header"
XXP_HEADER=$(curl -s -I "$API_BASE/" | grep -i "x-xss-protection" || echo "")
if [ -z "$XXP_HEADER" ]; then
    log_warn "Missing X-XSS-Protection header"
else
    log_pass "X-XSS-Protection found: $XXP_HEADER"
fi

###############################################################################
# 4. ERROR HANDLING TESTS
###############################################################################
log_header "4. ERROR HANDLING & INFORMATION DISCLOSURE"

# Test 4.1: Stack trace exposure
log_test "4.1 - Stack trace in error responses"
RESPONSE=$(curl -s -X POST "$API_BASE/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test","password":""}')
if echo "$RESPONSE" | grep -qi "stack\|trace\|at.*\.js"; then
    log_fail "Stack trace exposed in error response"
elif echo "$RESPONSE" | grep -qi "mongodb\|mongoose"; then
    log_fail "Database information exposed"
else
    log_pass "No obvious stack trace exposure"
fi

# Test 4.2: Database error exposure
log_test "4.2 - Database error information leakage"
RESPONSE=$(curl -s -X GET "$API_BASE/api/artists/invalid123" \
  -H "Authorization: Bearer dummy-token")
if echo "$RESPONSE" | grep -qi "objectid\|mongoose\|mongodb"; then
    log_fail "Database error information exposed"
else
    log_pass "Database errors properly sanitized"
fi

###############################################################################
# 5. RATE LIMITING TESTS
###############################################################################
log_header "5. RATE LIMITING & DOS PROTECTION"

# Test 5.1: Login rate limiting
log_test "5.1 - Login endpoint rate limiting"
echo "Sending 10 rapid login requests..."
RATE_LIMIT_HIT=false
for i in {1..10}; do
    HTTP_CODE=$(curl -s -X POST "$API_BASE/api/users/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"test@test.com","password":"test"}' \
      -w "%{http_code}" -o /dev/null)
    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_HIT=true
        break
    fi
    sleep 0.1
done

if [ "$RATE_LIMIT_HIT" = true ]; then
    log_pass "Rate limiting active (429 Too Many Requests)"
else
    log_fail "No rate limiting detected - brute force attacks possible"
fi

###############################################################################
# 6. REGEX DOS (ReDoS) TESTS
###############################################################################
log_header "6. REGULAR EXPRESSION DENIAL OF SERVICE (ReDoS)"

# Test 6.1: ReDoS pattern
log_test "6.1 - ReDoS vulnerability in search"
REDOS_PATTERN="(a+)+$"
START_TIME=$(date +%s)
HTTP_CODE=$(curl -s -X GET "$API_BASE/api/artworks?search=$REDOS_PATTERN" \
  -H "Authorization: Bearer dummy-token" \
  --max-time 3 \
  -w "%{http_code}" -o /dev/null 2>&1 || echo "timeout")
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ "$HTTP_CODE" = "timeout" ] || [ $DURATION -gt 2 ]; then
    log_fail "Possible ReDoS vulnerability (request took ${DURATION}s)"
else
    log_pass "ReDoS pattern handled efficiently (${DURATION}s)"
fi

###############################################################################
# SUMMARY
###############################################################################
log_header "TEST SUMMARY"

TOTAL=$((PASSED + FAILED + WARNING))
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNING${NC}"
echo -e "Total: $TOTAL"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}SECURITY ASSESSMENT: FAILED${NC}"
    echo -e "${RED}Critical vulnerabilities detected. Immediate action required.${NC}"
    exit 1
elif [ $WARNING -gt 5 ]; then
    echo -e "${YELLOW}SECURITY ASSESSMENT: NEEDS IMPROVEMENT${NC}"
    echo -e "${YELLOW}Multiple warnings detected. Review recommended.${NC}"
    exit 1
else
    echo -e "${GREEN}SECURITY ASSESSMENT: PASSED${NC}"
    echo -e "${GREEN}All critical tests passed.${NC}"
    exit 0
fi
