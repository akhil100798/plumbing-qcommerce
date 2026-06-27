$BASE = "http://localhost:8081/api/v1"

Write-Host "`n===================================================="
Write-Host "  PlumbCommerce 2.0 - FULL MANUAL QA TEST SUITE"
Write-Host "====================================================`n"

$results = @()

function Test-Case {
    param($id, $category, $role, $method, $path, $body, $token, $expectedStatus, $description)
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    
    try {
        $params = @{
            Uri = "$BASE$path"
            Method = $method
            Headers = $headers
            ErrorAction = "Stop"
        }
        if ($body) { $params.Body = ($body | ConvertTo-Json) }
        
        $resp = Invoke-WebRequest @params -UseBasicParsing
        $status = $resp.StatusCode
        $respBody = $resp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if (-not $status) { $status = "ERR" }
        $respBody = $null
    }
    
    $pass = ($status -eq $expectedStatus)
    $icon = if ($pass) { "PASS" } else { "FAIL" }
    
    Write-Host "[$icon] TC-$id | $role | $method $path | Expected=$expectedStatus Got=$status | $description"
    $results += [PSCustomObject]@{
        ID = $id; Category = $category; Role = $role
        Method = $method; Path = $path; Expected = $expectedStatus
        Actual = $status; Pass = $pass; Desc = $description
        Body = if ($respBody) { ($respBody | ConvertTo-Json -Compress) } else { "" }
    }
    return @{ Status=$status; Body=$respBody; Pass=$pass }
}

# ==========================================
# PHASE 1: REGISTRATION - Role Enforcement
# ==========================================
Write-Host "`n--- PHASE 1: REGISTRATION ---"

# TC-01: Register admin (role should be forced to CUSTOMER)
$r = Test-Case "01" "Auth" "GUEST" "POST" "/auth/register" `
    @{email="admin_qa@plumbcommerce.com";password="Admin@123";fullName="QA Admin";phone="9000000001";role="ADMIN"} `
    $null 201 "Register as ADMIN - role should be forced to CUSTOMER (security)"
$adminRegBody = $r.Body

# TC-02: Verify role was downgraded to CUSTOMER
if ($adminRegBody -and $adminRegBody.role) {
    $roleEnforced = ($adminRegBody.role -eq "CUSTOMER")
    $icon = if ($roleEnforced) { "PASS" } else { "FAIL" }
    Write-Host "[$icon] TC-02 | SECURITY | Role Enforcement - Got: $($adminRegBody.role) (should be CUSTOMER)"
}

# TC-03: Register STORE_MANAGER
$r = Test-Case "03" "Auth" "GUEST" "POST" "/auth/register" `
    @{email="manager_qa@plumbcommerce.com";password="Manager@123";fullName="QA Manager";phone="9000000002";role="STORE_MANAGER"} `
    $null 201 "Register STORE_MANAGER"

# TC-04: Register PLUMBER
$r = Test-Case "04" "Auth" "GUEST" "POST" "/auth/register" `
    @{email="plumber_qa@plumbcommerce.com";password="Plumber@123";fullName="QA Plumber";phone="9000000003";role="PLUMBER"} `
    $null 201 "Register PLUMBER"

# TC-05: Register CUSTOMER
$r = Test-Case "05" "Auth" "GUEST" "POST" "/auth/register" `
    @{email="customer_qa@plumbcommerce.com";password="Customer@123";fullName="QA Customer";phone="9000000004";role="CUSTOMER"} `
    $null 201 "Register CUSTOMER"

# TC-06: Duplicate registration should fail
$r = Test-Case "06" "Auth" "GUEST" "POST" "/auth/register" `
    @{email="customer_qa@plumbcommerce.com";password="Customer@123";fullName="QA Customer";phone="9000000004";role="CUSTOMER"} `
    $null 409 "Duplicate email registration"

# TC-07: Missing required field
$r = Test-Case "07" "Auth" "GUEST" "POST" "/auth/register" `
    @{email="";password="Test@123";fullName="Missing Email"} `
    $null 400 "Registration with empty email should fail"

# ==========================================
# PHASE 2: LOGIN / JWT
# ==========================================
Write-Host "`n--- PHASE 2: LOGIN & JWT ISSUANCE ---"

# TC-08: Valid admin login
$r = Test-Case "08" "Auth" "ADMIN" "POST" "/auth/login" `
    @{email="admin_qa@plumbcommerce.com";password="Admin@123"} `
    $null 200 "Valid login - returns JWT token"
$adminToken = $r.Body.token

# TC-09: Valid manager login
$r = Test-Case "09" "Auth" "STORE_MANAGER" "POST" "/auth/login" `
    @{email="manager_qa@plumbcommerce.com";password="Manager@123"} `
    $null 200 "Valid manager login"
$managerToken = $r.Body.token

# TC-10: Valid plumber login
$r = Test-Case "10" "Auth" "PLUMBER" "POST" "/auth/login" `
    @{email="plumber_qa@plumbcommerce.com";password="Plumber@123"} `
    $null 200 "Valid plumber login"
$plumberToken = $r.Body.token

# TC-11: Valid customer login
$r = Test-Case "11" "Auth" "CUSTOMER" "POST" "/auth/login" `
    @{email="customer_qa@plumbcommerce.com";password="Customer@123"} `
    $null 200 "Valid customer login"
$customerToken = $r.Body.token

# TC-12: Wrong password
$r = Test-Case "12" "Auth" "GUEST" "POST" "/auth/login" `
    @{email="customer_qa@plumbcommerce.com";password="WrongPassword!"} `
    $null 401 "Login with wrong password - should be 401"

# TC-13: Non-existent user (same error as wrong password - oracle prevention)
$r = Test-Case "13" "Auth" "GUEST" "POST" "/auth/login" `
    @{email="nonexistent@test.com";password="AnyPassword"} `
    $null 401 "Login with non-existent user - same error (oracle prevention)"

# TC-14: Empty credentials
$r = Test-Case "14" "Auth" "GUEST" "POST" "/auth/login" `
    @{email="";password=""} `
    $null 400 "Login with empty credentials"

# ==========================================
# PHASE 3: ENDPOINT SECURITY (No Token)
# ==========================================
Write-Host "`n--- PHASE 3: ENDPOINT SECURITY (No Auth) ---"

$r = Test-Case "15" "Security" "GUEST" "GET" "/users" $null $null 401 "GET /users without token -> 401"
$r = Test-Case "16" "Security" "GUEST" "GET" "/ai/demand-forecast" $null $null 401 "GET AI forecast without token -> 401"
$r = Test-Case "17" "Security" "GUEST" "GET" "/ai/dynamic-pricing" $null $null 401 "GET dynamic pricing without token -> 401"
$r = Test-Case "18" "Security" "GUEST" "GET" "/admin/metrics" $null $null 401 "GET admin metrics without token -> 401"
$r = Test-Case "19" "Security" "GUEST" "GET" "/catalog/products" $null $null 200 "GET catalog/products (public) -> 200"

# ==========================================
# PHASE 4: RBAC - CUSTOMER ROLE RESTRICTIONS
# ==========================================
Write-Host "`n--- PHASE 4: RBAC RESTRICTIONS (CUSTOMER) ---"

$r = Test-Case "20" "RBAC" "CUSTOMER" "GET" "/users" $null $customerToken 403 "Customer cannot list all users"
$r = Test-Case "21" "RBAC" "CUSTOMER" "GET" "/admin/metrics" $null $customerToken 403 "Customer cannot read admin metrics"
$r = Test-Case "22" "RBAC" "CUSTOMER" "GET" "/ai/demand-forecast" $null $customerToken 403 "Customer cannot read AI demand forecast"
$r = Test-Case "23" "RBAC" "CUSTOMER" "GET" "/ai/dynamic-pricing" $null $customerToken 403 "Customer cannot read dynamic pricing"

# ==========================================
# PHASE 5: RBAC - ADMIN ROLE PERMISSIONS
# ==========================================
Write-Host "`n--- PHASE 5: RBAC PERMISSIONS (ADMIN) ---"

$r = Test-Case "24" "RBAC" "ADMIN" "GET" "/ai/demand-forecast?topN=5" $null $adminToken 200 "Admin can read demand forecast"
$forecastData = $r.Body

$r = Test-Case "25" "RBAC" "ADMIN" "GET" "/ai/dynamic-pricing" $null $adminToken 200 "Admin can read dynamic pricing"
$pricingData = $r.Body

$r = Test-Case "26" "RBAC" "ADMIN" "GET" "/ai/bundle-suggestions?serviceType=NEARBY_AUTO" $null $adminToken 200 "Admin can read bundle suggestions"

$r = Test-Case "27" "RBAC" "ADMIN" "GET" "/admin/metrics" $null $adminToken 200 "Admin can read admin metrics"
$r = Test-Case "28" "RBAC" "ADMIN" "GET" "/users" $null $adminToken 200 "Admin can list users"

# ==========================================
# PHASE 6: CATALOG (Public & Authenticated)
# ==========================================
Write-Host "`n--- PHASE 6: PRODUCT CATALOG ---"

$r = Test-Case "29" "Catalog" "GUEST" "GET" "/catalog/products" $null $null 200 "Public catalog endpoint returns products"
$products = $r.Body

$r = Test-Case "30" "Catalog" "CUSTOMER" "GET" "/catalog/products" $null $customerToken 200 "Authenticated catalog access"

# ==========================================
# PHASE 7: SERVICE ORDER WORKFLOW (CUSTOMER)
# ==========================================
Write-Host "`n--- PHASE 7: SERVICE ORDER WORKFLOW ---"

$r = Test-Case "31" "Order" "CUSTOMER" "POST" "/orders" `
    @{description="Pipe burst in bathroom";customerLatitude=19.07;customerLongitude=72.87;requestType="NEARBY_AUTO"} `
    $customerToken 200 "Customer creates service order (PENDING)"
$serviceOrderId = $r.Body.id

if ($serviceOrderId) {
    Write-Host "    [INFO] Created ServiceOrder ID: $serviceOrderId"
}

# TC-32: Plumber cannot create a service order
$r = Test-Case "32" "Order" "PLUMBER" "POST" "/orders" `
    @{description="Testing";customerLatitude=19.07;customerLongitude=72.87;requestType="NEARBY_AUTO"} `
    $plumberToken 403 "Plumber CANNOT create service order (only CUSTOMER role)"

# TC-33: Guest cannot create service order
$r = Test-Case "33" "Order" "GUEST" "POST" "/orders" `
    @{description="Test";customerLatitude=19.07;customerLongitude=72.87;requestType="NEARBY_AUTO"} `
    $null 401 "Guest CANNOT create service order"

# TC-34: Create order with invalid requestType
$r = Test-Case "34" "Order" "CUSTOMER" "POST" "/orders" `
    @{description="Test";customerLatitude=19.07;customerLongitude=72.87;requestType="INVALID_TYPE"} `
    $customerToken 400 "Invalid requestType should return 400"

# ==========================================
# PHASE 8: AI ANALYTICS (AI SERVICES)
# ==========================================
Write-Host "`n--- PHASE 8: AI ANALYTICS ENDPOINTS ---"

# TC-35: Demand forecast - default topN
$r = Test-Case "35" "AI" "ADMIN" "GET" "/ai/demand-forecast" $null $adminToken 200 "Demand forecast - default topN"

# TC-36: Demand forecast with topN=3
$r = Test-Case "36" "AI" "ADMIN" "GET" "/ai/demand-forecast?topN=3" $null $adminToken 200 "Demand forecast with topN=3"
$forecast3 = $r.Body
if ($forecast3 -and $forecast3.Count) {
    Write-Host "    [INFO] Forecast returned $($forecast3.Count) products"
}

# TC-37: Dynamic pricing
$r = Test-Case "37" "AI" "ADMIN" "GET" "/ai/dynamic-pricing" $null $adminToken 200 "Dynamic pricing returns surge level"
$pricing = $r.Body
if ($pricing.surgeLevel) {
    Write-Host "    [INFO] Surge Level: $($pricing.surgeLevel) | Multiplier: $($pricing.deliverySurgeMultiplier)"
}

# TC-38: Bundle suggestions for each service type
$r = Test-Case "38" "AI" "ADMIN" "GET" "/ai/bundle-suggestions?serviceType=NEARBY_AUTO" $null $adminToken 200 "Bundle suggestions NEARBY_AUTO"
$r = Test-Case "39" "AI" "ADMIN" "GET" "/ai/bundle-suggestions?serviceType=STORE_ROUTED" $null $adminToken 200 "Bundle suggestions STORE_ROUTED"
$r = Test-Case "40" "AI" "ADMIN" "GET" "/ai/bundle-suggestions?serviceType=DIRECT_PLUMBER" $null $adminToken 200 "Bundle suggestions DIRECT_PLUMBER"

# TC-41: Dashboard metrics
$r = Test-Case "41" "AI" "ADMIN" "GET" "/ai/dashboard-metrics" $null $adminToken 200 "Dashboard KPI metrics"
$kpi = $r.Body
if ($kpi) {
    Write-Host "    [INFO] KPIs: ordersToday=$($kpi.ordersToday) | activePlumbers=$($kpi.activePlumbers) | lowStockAlerts=$($kpi.lowStockAlerts)"
}

# TC-42: Store manager can access AI endpoints
$r = Test-Case "42" "AI" "STORE_MANAGER" "GET" "/ai/demand-forecast" $null $managerToken 200 "Store manager can read AI demand forecast"
$r = Test-Case "43" "AI" "STORE_MANAGER" "GET" "/ai/dynamic-pricing" $null $managerToken 200 "Store manager can read dynamic pricing"

# ==========================================
# PHASE 9: EDGE SERVICE SECURITY
# ==========================================
Write-Host "`n--- PHASE 9: EDGE SERVICE (port 3000) ---"

function Test-Edge {
    param($id, $method, $path, $token, $expectedStatus, $description)
    $EDGE = "http://localhost:3000"
    $headers = @{ "Content-Type" = "application/json" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    try {
        $resp = Invoke-WebRequest -Uri "$EDGE$path" -Method $method -Headers $headers -UseBasicParsing -ErrorAction Stop
        $status = $resp.StatusCode
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if (-not $status) { $status = "ERR" }
    }
    $pass = ($status -eq $expectedStatus)
    $icon = if ($pass) { "PASS" } else { "FAIL" }
    Write-Host "[$icon] TC-$id | EDGE | $method $path | Expected=$expectedStatus Got=$status | $description"
}

Test-Edge "44" "GET" "/api/v1/edge/metrics/surge" $null 401 "Surge metrics without token -> 401"
Test-Edge "45" "GET" "/api/v1/edge/metrics/surge" $adminToken 200 "Surge metrics with admin token -> 200"

# ==========================================
# SUMMARY REPORT
# ==========================================
Write-Host "`n===================================================="
Write-Host "  FINAL QA SUMMARY"
Write-Host "===================================================="

$passed = ($results | Where-Object { $_.Pass -eq $true }).Count
$failed = ($results | Where-Object { $_.Pass -eq $false }).Count
$total = $results.Count

Write-Host "Total Tests : $total"
Write-Host "Passed      : $passed"
Write-Host "Failed      : $failed"
Write-Host "Pass Rate   : $([math]::Round(($passed/$total)*100, 1))%"
Write-Host ""

Write-Host "FAILED TESTS:"
$results | Where-Object { $_.Pass -eq $false } | ForEach-Object {
    Write-Host "  TC-$($_.ID): [$($_.Role)] $($_.Method) $($_.Path) - Expected=$($_.Expected) Got=$($_.Actual) - $($_.Desc)"
}
Write-Host ""
Write-Host "AI Insights:"
Write-Host "  Demand Forecast Items: $(if ($forecastData) { $forecastData.Count } else { 'N/A' })"
Write-Host "  Surge Level: $(if ($pricingData) { $pricingData.surgeLevel } else { 'N/A' })"

