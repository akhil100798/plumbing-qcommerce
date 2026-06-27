$BASE = "http://localhost:8081/api/v1"
Write-Host "`n============================================"
Write-Host "  PlumbCommerce 2.0 - FIX VERIFICATION SUITE"
Write-Host "============================================`n"

$pass = 0; $fail = 0
$rand = Get-Random -Minimum 100000 -Maximum 999999
$email = "fix_customer_$rand@test.com"

function Test {
    param($id, $desc, $method, $path, $body, $token, $expected)
    $h = @{ "Content-Type" = "application/json" }
    if ($token) { $h["Authorization"] = "Bearer $token" }
    try {
        $p = @{ Uri = "$BASE$path"; Method = $method; Headers = $h; UseBasicParsing = $true; ErrorAction = "Stop" }
        if ($body) { $p.Body = ($body | ConvertTo-Json) }
        $r = Invoke-WebRequest @p
        $status = $r.StatusCode
        $json = $r.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    } catch {
        $status = [int]$_.Exception.Response.StatusCode.value__
        if (-not $status) { $status = 0 }
        $json = $null
    }
    $ok = ($status -eq $expected)
    if ($ok) { $script:pass++ } else { $script:fail++ }
    $icon = if ($ok) { "PASS" } else { "FAIL" }
    Write-Host "[$icon] [$id] $desc | Expected=$expected Got=$status"
    return @{ Status=$status; Json=$json; OK=$ok }
}

# -- BUG-08: Empty login returns 400 -----------------------------------------
Write-Host "`n[BUG-08] Empty credentials return 400 not 401"
Test "08a" "Empty email+password -> 400" "POST" "/auth/login" @{email="";password=""} $null 400 | Out-Null
Test "08b" "Missing email field -> 400" "POST" "/auth/register" @{password="Test@123";fullName="Test";phone="9000000099"} $null 400 | Out-Null

# -- BUG-09: Catalog is public -------------------------------------------------
Write-Host "`n[BUG-09] Catalog endpoint is publicly accessible"
$cat = Test "09a" "GET /catalog/products (no token) -> 200" "GET" "/catalog/products" $null $null 200
Test "09b" "GET /catalog/categories (no token) -> 200" "GET" "/catalog/categories" $null $null 200 | Out-Null

# -- BUG-06: Register + full login cycle ---------------------------------------
Write-Host "`n[BUG-06 / BUG-07] Registration with explicit role + login"
# Register customer (role forced)
$regC = Test "06a" "Register CUSTOMER ($email) -> 201" "POST" "/auth/register" `
    @{email=$email;password="Fix@12345";fullName="Fix Customer";phone="9100000001";role="CUSTOMER"} $null 201
Write-Host "  Role in response: $($regC.Json.role)"

# Login customer
$loginC = Test "07a" "Login CUSTOMER -> 200" "POST" "/auth/login" `
    @{email=$email;password="Fix@12345"} $null 200
$custToken = $loginC.Json.token
Write-Host "  Token obtained: $(if ($custToken) { 'YES' } else { 'NO' })"

# -- BUG-10: RBAC returns 403 not 500 for CUSTOMER on AI endpoints ------------
Write-Host "`n[BUG-10] CUSTOMER accessing AI endpoints -> 403 (not 500)"
if ($custToken) {
    Test "10a" "Customer -> /ai/demand-forecast -> 403" "GET" "/ai/demand-forecast" $null $custToken 403 | Out-Null
    Test "10b" "Customer -> /ai/dynamic-pricing -> 403" "GET" "/ai/dynamic-pricing" $null $custToken 403 | Out-Null
    Test "10c" "Customer -> /admin/metrics -> 403" "GET" "/admin/metrics" $null $custToken 403 | Out-Null
} else {
    Write-Host "  SKIP - no customer token available"
    $script:fail += 3
}

# -- BUG-11: Service order with typed DTO -------------------------------------
Write-Host "`n[BUG-11] Service order creation with correct field names"
if ($custToken) {
    $order = Test "11a" "Create order with lat/lon -> 200" "POST" "/orders" `
        @{description="Pipe burst test";latitude=19.07;longitude=72.87;requestType="NEARBY_AUTO"} $custToken 200
    Write-Host "  Order ID: $($order.Json.id)"
    # BUG-12: Invalid enum -> 400
    Test "12a" "Invalid requestType -> 400" "POST" "/orders" `
        @{description="Test";latitude=19.07;longitude=72.87;requestType="INVALID_TYPE"} $custToken 400 | Out-Null
} else {
    Write-Host "  SKIP - no customer token"
    $script:fail += 2
}

# -- Auth security: wrong password still 401 ----------------------------------
Write-Host "`n[Security] Oracle prevention still working"
Test "sec1" "Wrong password -> 401" "POST" "/auth/login" `
    @{email=$email;password="WrongPass"} $null 401 | Out-Null
Test "sec2" "Nonexistent user -> 401" "POST" "/auth/login" `
    @{email="ghost@nobody.com";password="AnyPass"} $null 401 | Out-Null
Test "sec3" "No token on protected route -> 401" "GET" "/users" $null $null 401 | Out-Null

# -- Edge Service -------------------------------------------------------------
Write-Host "`n[BUG-13] Edge service surge endpoint auth"
$EDGE = "http://localhost:3000"
try {
    $r = Invoke-WebRequest -Uri "$EDGE/api/v1/edge/metrics/surge" -Method GET -UseBasicParsing -ErrorAction Stop
    $s = $r.StatusCode
} catch { $s = [int]$_.Exception.Response.StatusCode.value__ }
$ok = ($s -eq 401)
if ($ok) { $pass++ } else { $fail++ }
Write-Host "[$(if ($ok) { 'PASS' } else { 'FAIL' })] [13a] Edge surge (no token) -> 401 | Got=$s"

if ($custToken) {
    try {
        $r2 = Invoke-WebRequest -Uri "$EDGE/api/v1/edge/metrics/surge" -Method GET `
            -Headers @{Authorization="Bearer $custToken"} -UseBasicParsing -ErrorAction Stop
        $s2 = $r2.StatusCode
    } catch { $s2 = [int]$_.Exception.Response.StatusCode.value__ }
    $ok2 = ($s2 -eq 200)
    if ($ok2) { $pass++ } else { $fail++ }
    Write-Host "[$(if ($ok2) { 'PASS' } else { 'FAIL' })] [13b] Edge surge (with token) -> 200 | Got=$s2"
}

# -- Final Summary -------------------------------------------------------------
$total = $pass + $fail
Write-Host "`n============================================"
Write-Host "  VERIFICATION RESULTS"
Write-Host "============================================"
Write-Host "  Total : $total"
Write-Host "  Pass  : $pass"
Write-Host "  Fail  : $fail"
if ($total -gt 0) {
    Write-Host "  Rate  : $([math]::Round($pass/$total*100,1))%"
}
Write-Host "============================================"
