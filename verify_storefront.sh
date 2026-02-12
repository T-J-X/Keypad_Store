#!/usr/bin/env bash
set -u

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3001}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/keypad_verify_storefront.cookies}"

PAGES=("/shop" "/cart" "/checkout" "/login" "/account" "/order/TEST-CODE")
APIS=("/api/session/summary" "/api/cart/active" "/api/auth/google")

PASS_COUNT=0
FAIL_COUNT=0

print_line() {
  printf '%s\n' "$1"
}

record_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  print_line "✅ $1"
}

record_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  print_line "❌ $1"
}

status_ok_2xx() {
  local status="$1"
  [[ "$status" =~ ^[0-9]{3}$ ]] && [ "$status" -ge 200 ] && [ "$status" -lt 300 ]
}

status_ok_2xx_3xx() {
  local status="$1"
  [[ "$status" =~ ^[0-9]{3}$ ]] && [ "$status" -ge 200 ] && [ "$status" -lt 400 ]
}

check_page() {
  local path="$1"
  local status
  status=$(curl -sS -o /dev/null -w "%{http_code}" "$FRONTEND_URL$path" 2>/dev/null || true)
  status="${status:0:3}"
  [[ "$status" =~ ^[0-9]{3}$ ]] || status="000"

  if status_ok_2xx "$status"; then
    record_pass "PAGE $path (Status: $status)"
  else
    record_fail "PAGE $path (Status: $status)"
  fi
}

check_api() {
  local path="$1"
  local status
  status=$(curl -sS -o /dev/null -w "%{http_code}" "$FRONTEND_URL$path" 2>/dev/null || true)
  status="${status:0:3}"
  [[ "$status" =~ ^[0-9]{3}$ ]] || status="000"

  if [ "$path" = "/api/auth/google" ]; then
    if status_ok_2xx_3xx "$status"; then
      record_pass "API  $path (Status: $status, redirect expected)"
    else
      record_fail "API  $path (Status: $status)"
    fi
    return
  fi

  if status_ok_2xx "$status"; then
    record_pass "API  $path (Status: $status)"
  else
    record_fail "API  $path (Status: $status)"
  fi
}

run_session_continuity_check() {
  rm -f "$COOKIE_JAR" /tmp/verify_storefront_add_headers.txt

  local products_json variant_id
  products_json=$(curl -sS -H 'Content-Type: application/json' \
    -d '{"query":"query VerifyProducts { products(options:{ take: 1 }) { items { variants { id } } } }"}' \
    "$BACKEND_URL/shop-api" 2>/dev/null || true)

  variant_id=$(printf '%s' "$products_json" | node -e "const fs=require('fs');try{const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(d?.data?.products?.items?.[0]?.variants?.[0]?.id||'');}catch{process.stdout.write('');}" 2>/dev/null)

  if [ -z "$variant_id" ]; then
    record_fail "Session continuity: could not resolve a product variant id from $BACKEND_URL/shop-api"
    return
  fi

  local add_resp add_status add_body add_ok
  add_resp=$(curl -sS -D /tmp/verify_storefront_add_headers.txt -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -H 'Content-Type: application/json' \
    -d "{\"productVariantId\":\"$variant_id\",\"quantity\":1}" \
    -w '__HTTP_STATUS__:%{http_code}' \
    "$FRONTEND_URL/api/cart/add-item" 2>/dev/null || echo '__HTTP_STATUS__:000')
  add_status=${add_resp##*__HTTP_STATUS__:}
  add_body=${add_resp%__HTTP_STATUS__*}
  add_ok=$(printf '%s' "$add_body" | node -e "const fs=require('fs');try{const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(d?.ok===true?'true':'false');}catch{process.stdout.write('false');}" 2>/dev/null)

  if ! status_ok_2xx "$add_status" || [ "$add_ok" != "true" ]; then
    record_fail "Session continuity: add-item failed (status: $add_status)"
    return
  fi

  local cookie_header_ok
  cookie_header_ok=$(rg -i "^set-cookie:.*(vendure-auth|session|auth)" /tmp/verify_storefront_add_headers.txt >/dev/null && echo "true" || echo "false")
  if [ "$cookie_header_ok" = "true" ]; then
    record_pass "Session continuity: add-item returned Set-Cookie header"
  else
    record_fail "Session continuity: add-item missing expected Set-Cookie header"
  fi

  local active_resp active_status active_body total_qty
  active_resp=$(curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -w '__HTTP_STATUS__:%{http_code}' "$FRONTEND_URL/api/cart/active" 2>/dev/null || echo '__HTTP_STATUS__:000')
  active_status=${active_resp##*__HTTP_STATUS__:}
  active_body=${active_resp%__HTTP_STATUS__*}
  total_qty=$(printf '%s' "$active_body" | node -e "const fs=require('fs');try{const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(String(d?.order?.totalQuantity ?? 0));}catch{process.stdout.write('0');}" 2>/dev/null)

  if status_ok_2xx "$active_status" && [ "${total_qty:-0}" -ge 1 ] 2>/dev/null; then
    record_pass "Session continuity: /api/cart/active shows totalQuantity=$total_qty"
  else
    record_fail "Session continuity: /api/cart/active failed or empty cart (status: $active_status, qty: ${total_qty:-0})"
  fi
}

print_line "🚀 Starting Storefront Health Check"
print_line "Frontend: $FRONTEND_URL"
print_line "Backend:  $BACKEND_URL"
print_line "------------------------------------"
print_line "1) Frontend page checks"
for page in "${PAGES[@]}"; do
  check_page "$page"
done

print_line "------------------------------------"
print_line "2) API checks"
for api in "${APIS[@]}"; do
  check_api "$api"
done

print_line "------------------------------------"
print_line "3) Session continuity check"
run_session_continuity_check

print_line "------------------------------------"
print_line "🏁 Health Check Complete"
print_line "Passed: $PASS_COUNT"
print_line "Failed: $FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
