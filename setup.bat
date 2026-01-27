@echo off
echo Starting setup process...
echo.

echo [1/4] Generating Prisma Client...
call pnpm run db:generate
if errorlevel 1 (
    echo Error with pnpm, trying npm...
    call npm run db:generate
)

echo.
echo [2/4] Verifying .env and pushing database schema...
if exist .env (
    findstr /C:"DATABASE_URL" .env >nul
    if errorlevel 1 (
        echo WARNING: DATABASE_URL not found in .env file!
    ) else (
        echo DATABASE_URL found in .env
        call pnpm run db:push
        if errorlevel 1 (
            echo Error with pnpm, trying npm...
            call npm run db:push
        )
    )
) else (
    echo WARNING: .env file not found!
)

echo.
echo [3/4] Installing Playwright Chromium browser...
call npx playwright install chromium

echo.
echo [4/4] Setup complete!
echo.
echo Next steps:
echo 1. Restart your dev server: pnpm dev (or npm run dev)
echo 2. Verify Prisma client is working
echo 3. Test scraper endpoints
echo.
pause
