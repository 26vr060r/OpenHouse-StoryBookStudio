@echo off
setlocal
cd /d "%~dp0app"
if not exist "index.html" (
  echo app\index.html が見つかりません。このバッチはリポジトリ直下に置いてください。
  pause
  exit /b 1
)

echo キオスク（歯車を隠す）でサーバを起動します。この窓は閉じないでください。
echo 止めるときはこの窓をクリックして Ctrl + C を押し、確認が出たら Y を押します。
echo.
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:8080/index.html?kiosk=1"

where python >nul 2>&1
if %errorlevel%==0 (
  python -m http.server 8080
  goto :eof
)
where py >nul 2>&1
if %errorlevel%==0 (
  py -m http.server 8080
  goto :eof
)
where npx >nul 2>&1
if %errorlevel%==0 (
  npx --yes serve -l 8080
  goto :eof
)

echo Python が見つかりません。python または py を入れてから、もう一度このバッチを実行してください。
pause
exit /b 1
