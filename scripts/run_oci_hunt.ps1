# OCI Free Tier Instance Hunter - Runner Script
# Run this to start hunting for an Always Free A1 instance

$OCI_PYTHON = "C:\Users\rajat\lib\oracle-cli\Scripts\python.exe"
$SCRIPT_PATH = "$PSScriptRoot\oci_hunt.py"

# Optional: Set Telegram bot token for notifications
# $env:TELEGRAM_BOT_TOKEN = "your-bot-token-here"
# $env:TELEGRAM_CHAT_ID = "7011095516"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OCI Free Tier Instance Hunter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Config:" -ForegroundColor Yellow
Write-Host "  - Python: $OCI_PYTHON"
Write-Host "  - Script: $SCRIPT_PATH"
Write-Host "  - Regions: 15 (parallel attempts)"
Write-Host "  - Retry interval: 30 seconds"
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

& $OCI_PYTHON $SCRIPT_PATH $args
