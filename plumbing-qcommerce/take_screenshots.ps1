# take_screenshots.ps1
# This script helps capture screenshots directly from the running emulator and saves them to /evidence/screenshots/

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
    # Try finding it in path
    $adbPath = Get-Command adb -ErrorAction SilentlyContinue
    if ($adbPath) {
        $adb = $adbPath.Source
    } else {
        Write-Error "ADB not found. Please install Android Platform Tools or set Android SDK path."
        exit 1
    }
}

$screenshotDir = "d:\personal project\plumbing-qcommerce\evidence\screenshots"
if (-not (Test-Path $screenshotDir)) {
    New-Item -ItemType Directory -Force -Path $screenshotDir | Out-Null
}

function Capture-Screen {
    param([string]$filename)
    Write-Host "📸 Capturing $filename..." -ForegroundColor Cyan
    $targetPath = "$screenshotDir\$filename"
    
    # Run adb screencap and save directly
    & $adb exec-out screencap -p > $targetPath
    
    if (Test-Path $targetPath) {
        Write-Host "✅ Saved to: $targetPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to save screenshot" -ForegroundColor Red
    }
}

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "   PlumbCommerce Emulator Screenshot Utility" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "Ensure the customer app is running in your emulator."
Write-Host ""

$screens = @(
    @{ id = "01_splash"; name = "Splash Screen" },
    @{ id = "02_onboarding"; name = "Onboarding Screen" },
    @{ id = "03_login"; name = "Login Screen" },
    @{ id = "04_otp"; name = "OTP Screen" },
    @{ id = "05_home"; name = "Home Screen" },
    @{ id = "06_search"; name = "Search Screen" },
    @{ id = "07_categories"; name = "Categories Screen" },
    @{ id = "08_product_listing"; name = "Product Listing Screen" },
    @{ id = "09_product_details"; name = "Product Details Screen" },
    @{ id = "10_cart"; name = "Cart Screen" },
    @{ id = "11_address"; name = "Address Screen" },
    @{ id = "12_payment"; name = "Payment Screen" },
    @{ id = "13_orders"; name = "Orders Screen" },
    @{ id = "14_profile"; name = "Profile Screen" },
    @{ id = "15_stores"; name = "Stores Screen" },
    @{ id = "16_support"; name = "Support Screen" },
    @{ id = "17_chat"; name = "Chat Screen" }
)

foreach ($screen in $screens) {
    Write-Host ""
    Write-Host "👉 Please navigate the emulator to: $($screen.name)" -ForegroundColor White
    $key = Read-Host "Press [Enter] to capture screenshot, or type 's' to skip this screen"
    if ($key -ne 's') {
        Capture-Screen "$($screen.id).png"
    }
}

Write-Host ""
Write-Host "🎉 Screenshot capture session complete!" -ForegroundColor Green
Write-Host "All files saved in: $screenshotDir" -ForegroundColor Yellow
