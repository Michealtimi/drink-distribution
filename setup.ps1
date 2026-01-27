# Setup script for Prisma Client and Scraper Setup
# Run this script in PowerShell: .\setup.ps1

Write-Host "Starting setup process..." -ForegroundColor Green

# Step 1: Generate Prisma Client
Write-Host "`n[1/4] Generating Prisma Client..." -ForegroundColor Yellow
pnpm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error generating Prisma client. Trying with npm..." -ForegroundColor Red
    npm run db:generate
}

# Step 2: Verify .env and push database schema
Write-Host "`n[2/4] Verifying .env and pushing database schema..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "DATABASE_URL found in .env" -ForegroundColor Green
        pnpm run db:push
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error pushing schema. Trying with npm..." -ForegroundColor Red
            npm run db:push
        }
    } else {
        Write-Host "WARNING: DATABASE_URL not found in .env file!" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
}

# Step 3: Install Playwright browsers
Write-Host "`n[3/4] Installing Playwright Chromium browser..." -ForegroundColor Yellow
npx playwright install chromium
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing Playwright. Make sure npx is available." -ForegroundColor Red
}

# Step 4: Summary
Write-Host "`n[4/4] Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server: pnpm dev (or npm run dev)" -ForegroundColor White
Write-Host "2. Verify Prisma client is working by checking for .prisma directory" -ForegroundColor White
Write-Host "3. Test scraper endpoints to ensure everything is working" -ForegroundColor White
