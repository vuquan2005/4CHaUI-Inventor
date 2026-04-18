<# :
@echo off
title Cong cu tao README tu dong
setlocal
cd /d "%~dp0"

echo ---------------------------------------------------
echo    DANG KHOI TAO TRINH TAO README TU DONG...
echo ---------------------------------------------------

:: Chay PowerShell ben trong Batch
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content '%~f0') -join [Environment]::NewLine)"

echo.
echo ---------------------------------------------------
echo    HOAN TAT! NHAN PHIM BAT KY DE THOAT.
echo ---------------------------------------------------
pause > nul
exit /b
#>