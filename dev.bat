@echo off
echo ==================================================
echo      SIMAK MOBILE - DEVELOPMENT LAUNCHER
echo ==================================================

echo.
echo [1/4] Configuring ADB Reverse Tunneling...
:: Meneruskan port 8000 (Laravel) dan 8081 (Metro Bundler) dari HP ke Laptop
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] ADB command failed. Make sure your phone is connected and USB Debugging is ON.
    pause
) else (
    echo [OK] ADB Reverse connected.
)

echo.
echo [2/4] Starting Laravel Backend (New Window)...
cd backend
:: Membuka jendela baru untuk Laravel agar tidak memblokir script ini
start "Laravel Backend (Port 8000)" php artisan serve
cd ..

echo.
echo [3/4] Starting React Native Metro Bundler (New Window)...
cd frontend
:: Membuka jendela baru untuk Metro Bundler
start "React Native Metro (Port 8081)" npm start
cd ..

echo.
echo [4/4] Installing & Launching App on Android...
cd frontend
:: Proses ini akan berjalan di jendela ini. Tunggu hingga aplikasi terbuka di HP.
cmd /c "npm run android"
cd ..

echo.
echo ==================================================
echo      ALL SYSTEMS GO!
echo ==================================================
echo You can close this window after the app launches.
pause
