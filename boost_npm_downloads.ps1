# PowerShell Script to simulate NPM downloads

$Package = "@earnwithalee/stacksrank-sdk"
$Iterations = 100

Write-Host "Starting manual download boost for $Package..." -ForegroundColor Cyan

for ($i = 1; $i -le $Iterations; $i++) {
    Write-Host "Download iteration $i of $Iterations..."
    
    # Clear cache to ensure a fresh fetch
    npm cache clean --force | Out-Null
    
    # Install the package temporarily
    npm install $Package --no-save --quiet | Out-Null
    
    # Optional delay to avoid rate limits
    Start-Sleep -Milliseconds 500
}

Write-Host "Completed $Iterations downloads. Note that npm unique IP rules may apply." -ForegroundColor Green
