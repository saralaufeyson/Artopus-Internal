#!/bin/bash
###############################################################################
# Artopus Frontend QA & Security Test Suite
# Automated frontend tests: Performance, Accessibility, SEO, and Security.
#
# Usage: ./frontend-test-suite.sh [FRONTEND_URL]
# Example: ./frontend-test-suite.sh http://localhost:3000
###############################################################################

set +e

# Configuration
FRONTEND_URL="${1:-http://localhost:3000}"
RESULTS_DIR="frontend-test-results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$RESULTS_DIR/report-$TIMESTAMP.txt"
LIGHTHOUSE_REPORT="$RESULTS_DIR/lighthouse-$TIMESTAMP.html"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No color

# Helper logging
log_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

mkdir -p "$RESULTS_DIR"
echo "Artopus Frontend QA & Security Test - $TIMESTAMP" > "$REPORT_FILE"
echo "Target URL: $FRONTEND_URL" >> "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"

###############################################################################
# 1. BASIC REACHABILITY
###############################################################################
log_header "1. BASIC REACHABILITY"

if curl -s --head --request GET "$FRONTEND_URL" | grep "200 OK" > /dev/null; then
    log_pass "Frontend reachable at $FRONTEND_URL"
else
    log_fail "Frontend not reachable"
fi

###############################################################################
# 2. SECURITY HEADERS
###############################################################################
log_header "2. SECURITY HEADERS"

check_header() {
    HEADER_NAME=$1
    FRIENDLY_NAME=$2
    RESULT=$(curl -s -I "$FRONTEND_URL" | grep -i "$HEADER_NAME" || true)
    if [ -z "$RESULT" ]; then
        log_warn "Missing $FRIENDLY_NAME ($HEADER_NAME)"
    else
        log_pass "$FRIENDLY_NAME found: $RESULT"
    fi
}

check_header "content-security-policy" "Content-Security-Policy"
check_header "x-frame-options" "X-Frame-Options"
check_header "x-content-type-options" "X-Content-Type-Options"
check_header "strict-transport-security" "Strict-Transport-Security"
check_header "referrer-policy" "Referrer-Policy"

###############################################################################
# 3. LIGHTHOUSE AUDIT
###############################################################################
log_header "3. LIGHTHOUSE PERFORMANCE & ACCESSIBILITY AUDIT"

if ! command -v lighthouse &> /dev/null; then
    log_warn "Lighthouse not installed. Install with: npm install -g lighthouse"
else
    echo "Running Lighthouse... this may take a minute."
    lighthouse "$FRONTEND_URL" \
      --quiet --chrome-flags="--headless" \
      --output html \
      --output-path "$LIGHTHOUSE_REPORT" \
      --only-categories=performance,accessibility,best-practices,seo

    if [ $? -eq 0 ]; then
        log_pass "Lighthouse report generated: $LIGHTHOUSE_REPORT"
    else
        log_fail "Lighthouse failed to complete."
    fi
fi

###############################################################################
# 4. DEPENDENCY VULNERABILITY CHECK
###############################################################################
log_header "4. FRONTEND DEPENDENCY AUDIT"

if [ -f package.json ]; then
    echo "Running npm audit..."
    npm audit --production > "$RESULTS_DIR/npm-audit-$TIMESTAMP.txt" 2>&1
    if grep -q "found 0 vulnerabilities" "$RESULTS_DIR/npm-audit-$TIMESTAMP.txt"; then
        log_pass "No dependency vulnerabilities found"
    else
        log_warn "Vulnerabilities detected. See npm-audit-$TIMESTAMP.txt"
    fi
else
    log_warn "No package.json found — skipping dependency audit"
fi

###############################################################################
# 5. FRONTEND FORM & XSS TESTS (BASIC)
###############################################################################
log_header "5. FRONTEND FORM VALIDATION (MANUAL SPOT CHECK)"

echo "⚠️ Automated browser-level form tests require Playwright or Cypress."
echo "You can extend this script later to launch E2E tests."
echo "For now, manually test: invalid inputs, missing fields, and XSS payloads."

###############################################################################
# 6. SUMMARY
###############################################################################
log_header "TEST SUMMARY"

echo "Full report saved at: $REPORT_FILE"
echo "Lighthouse report (HTML): $LIGHTHOUSE_REPORT"

echo -e "\n${GREEN}Frontend QA & Security Testing Completed.${NC}"
echo "========================================"
