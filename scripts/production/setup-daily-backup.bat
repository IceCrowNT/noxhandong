@echo off
chcp 65001 > nul
:: Chuyển đến thư mục gốc của dự án
cd /d "%~dp0"
cd ..\..
set PROJECT_DIR=%CD%
set SCRIPT_PATH=%PROJECT_DIR%\scripts\production\backup-postgres.ps1

echo ========================================================
echo CAI DAT BACKUP TU DONG - 2H SANG MOI NGAY
echo ========================================================
echo Thu muc du an: %PROJECT_DIR%
echo File se chay: %SCRIPT_PATH%
echo.

:: Lenh dang ky vao Windows Task Scheduler (Chay duoi quyen SYSTEM de khong can login)
schtasks /Create /TN "Noxh_DB_Backup_2AM" /TR "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%SCRIPT_PATH%\"" /SC DAILY /ST 02:00 /RU SYSTEM /RL HIGHEST /F

echo.
echo [THANH CONG] Da dang ky lich chay vao he thong Windows!
echo Bat dau tu dem nay, may chu se tu dong backup vao luc 2:00 sang.
echo.
pause
