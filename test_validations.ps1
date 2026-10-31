# ==============================================================================
# SCRIPT KIEM THU TU DONG TAT CA CAC RANG BUOC DU LIEU DAU VAO (VALIDATION TESTS)
# ==============================================================================

$baseUrl = "http://localhost:8080"
$totalTests = 0
$passedTests = 0

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message
    )
    $script:totalTests++
    if ($Success) {
        $script:passedTests++
        Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
        Write-Host "$TestName : " -ForegroundColor White -NoNewline
        Write-Host "$Message" -ForegroundColor Gray
    } else {
        Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
        Write-Host "$TestName : " -ForegroundColor Yellow -NoNewline
        Write-Host "$Message" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  BAT DAU CHAY BO TEST TU DONG VALIDATION (BACKEND API)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. DANG NHAP LAY TOKEN ADMIN
Write-Host "[1] Dang nhap tai khoan Admin lay JWT Token..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@fashionstore.vn"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-TestResult "Dang nhap Admin" ($null -ne $token) "Lay JWT token thanh cong"
} catch {
    Write-TestResult "Dang nhap Admin" $false "Loi dang nhap: $($_.Exception.Message)"
    exit
}

# 2. TEST NHAP KHO (INBOUND ORDERS)
Write-Host ""
Write-Host "[2] Kiem tra Nhap kho (Inbound Orders)..." -ForegroundColor Yellow

# 2.1 Chan ngay nhap trong qua khu
try {
    $body = @{
        importDate = "2020-01-01T10:00:00"
        supplierName = "NCC Test"
        items = @(@{ variantId = 1; quantity = 10; importPrice = 50000 })
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/staff/inbound/orders" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan ngay nhap qua khu" $false "He thong khong chan ngay qua khu"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan ngay nhap qua khu" $true "Da chan thanh cong ($msg)"
}

# 2.2 Chan trung lap bien the trong cung 1 phieu
try {
    $body = @{
        importDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        supplierName = "NCC Test"
        items = @(
            @{ variantId = 1; quantity = 5; importPrice = 50000 },
            @{ variantId = 1; quantity = 10; importPrice = 60000 }
        )
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/staff/inbound/orders" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan trung lap variantId" $false "He thong cho phep trung bien the trong 1 phieu"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan trung lap variantId" $true "Da chan thanh cong ($msg)"
}

# 2.3 Chan so luong <= 0
try {
    $body = @{
        importDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        supplierName = "NCC Test"
        items = @(@{ variantId = 1; quantity = 0; importPrice = 50000 })
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/staff/inbound/orders" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan so luong <= 0" $false "He thong cho phep so luong = 0"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan so luong <= 0" $true "Da chan thanh cong ($msg)"
}

# 3. TEST DANH MUC (CATEGORIES)
Write-Host ""
Write-Host "[3] Kiem tra Danh muc (Categories)..." -ForegroundColor Yellow

# 3.1 Chan ten danh muc rong
try {
    $body = @{ name = "    " } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/categories" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan ten danh muc rong" $false "He thong cho phep ten rong"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan ten danh muc rong" $true "Da chan thanh cong ($msg)"
}

# 3.2 Chan tu chon chinh minh lam danh muc cha (Circular Parent)
try {
    $body = @{ name = "Ao Test"; parentId = 1 } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/categories/1" -Method Put -Body $body -Headers $headers
    Write-TestResult "Chan Circular Parent" $false "He thong cho phep chon chinh minh lam cha"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan Circular Parent" $true "Da chan thanh cong ($msg)"
}

# 4. TEST SAN PHAM (PRODUCTS)
Write-Host ""
Write-Host "[4] Kiem tra San pham (Products)..." -ForegroundColor Yellow

# 4.1 Chan gia khuyen mai >= gia goc
try {
    $body = @{
        name = "Ao Thun Test Validation"
        basePrice = 200000
        discountPrice = 250000
        categoryId = 1
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/products" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan discountPrice >= basePrice" $false "He thong cho phep gia KM >= gia goc"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan discountPrice >= basePrice" $true "Da chan thanh cong ($msg)"
}

# 4.2 Chan gia goc <= 0
try {
    $body = @{
        name = "Ao Thun Test Gia Am"
        basePrice = -1000
        categoryId = 1
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/products" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan basePrice <= 0" $false "He thong cho phep gia goc <= 0"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan basePrice <= 0" $true "Da chan thanh cong ($msg)"
}

# 5. TEST BIEN THE SAN PHAM (PRODUCT VARIANTS)
Write-Host ""
Write-Host "[5] Kiem tra Bien the san pham (Variants)..." -ForegroundColor Yellow

# 5.1 Chan ma SKU chua ky tu dac biet
try {
    $body = @{
        productId = 1
        sku = "SKU@#$ TEST"
        size = "M"
        color = "Do"
        stockQuantity = 10
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/variants" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan dinh dang SKU chua ky tu la" $false "He thong cho phep ky tu la trong SKU"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan dinh dang SKU chua ky tu la" $true "Da chan thanh cong ($msg)"
}

# 5.2 Chan so luong ton kho am
try {
    $body = @{
        productId = 1
        sku = "SKU-VALID-01"
        stockQuantity = -5
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/variants" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan stockQuantity am" $false "He thong cho phep ton kho am"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan stockQuantity am" $true "Da chan thanh cong ($msg)"
}

# 6. TEST MA GIAM GIA (COUPONS)
Write-Host ""
Write-Host "[6] Kiem tra Ma giam gia (Coupons)..." -ForegroundColor Yellow

# 6.1 Chan giam gia fixed lon hon don hang toi thieu
try {
    $body = @{
        code = "GIAM200K"
        discountType = "fixed"
        discountValue = 200000
        minOrderValue = 100000
        startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        endDate = (Get-Date).AddDays(10).ToString("yyyy-MM-ddTHH:mm:ss")
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/coupons" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan fixed discount > don toi thieu" $false "He thong cho phep giam vuot don toi thieu"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan fixed discount > don toi thieu" $true "Da chan thanh cong ($msg)"
}

# 6.2 Chan ma coupon co ky tu khoang trang hoac ky tu dac biet
try {
    $body = @{
        code = "DISCOUNT 50PERCENT"
        discountType = "percent"
        discountValue = 10
        startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        endDate = (Get-Date).AddDays(10).ToString("yyyy-MM-ddTHH:mm:ss")
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/coupons" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan ma coupon chua khoang trang" $false "He thong cho phep ma coupon chua khoang trang"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan ma coupon chua khoang trang" $true "Da chan thanh cong ($msg)"
}

# 7. TEST QUAN LY NHAN VIEN & NGUOI DUNG (STAFF / USERS)
Write-Host ""
Write-Host "[7] Kiem tra Quan ly Nhan vien & Nguoi dung (Staff / Users)..." -ForegroundColor Yellow

# 7.1 Chan tao nhan vien voi Email da ton tai
try {
    $body = @{
        fullName = "Nhan vien trung email"
        email = "admin@fashionstore.vn"
        password = "password123"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/staff" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan tao Staff trung Email" $false "He thong cho phep trung email"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan tao Staff trung Email" $true "Da chan thanh cong ($msg)"
}

# 7.2 Chan tao nhan vien voi mat khau qua ngan (< 6 ky tu)
try {
    $rand = Get-Random
    $body = @{
        fullName = "Nhan vien pass ngan"
        email = "unique_staff_$rand@fashionstore.vn"
        password = "123"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/staff" -Method Post -Body $body -Headers $headers
    Write-TestResult "Chan mat khau Staff < 6 ky tu" $false "He thong cho phep mat khau < 6 ky tu"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan mat khau Staff < 6 ky tu" $true "Da chan thanh cong ($msg)"
}

# 8. TEST BAO CAO THONG KE (ADMIN REPORTS)
Write-Host ""
Write-Host "[8] Kiem tra Bao cao thong ke (Reports)..." -ForegroundColor Yellow

# 8.1 Chan khoang thoi gian startDate > endDate
try {
    Invoke-RestMethod -Uri "$baseUrl/api/admin/reports/revenue?startDate=2026-12-31&endDate=2026-01-01" -Method Get -Headers $headers
    Write-TestResult "Chan startDate > endDate" $false "He thong cho phep ngay bat dau sau ngay ket thuc"
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg = if ($err.message) { $err.message } else { $_.Exception.Message }
    Write-TestResult "Chan startDate > endDate" $true "Da chan thanh cong ($msg)"
}

# KET QUA TONG HOP
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
$color = if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" }
Write-Host "  TONG KET KET QUA KIEM THU: $passedTests / $totalTests PASS" -ForegroundColor $color
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""