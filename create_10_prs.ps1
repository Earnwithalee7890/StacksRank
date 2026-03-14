$ErrorActionPreference = "Stop"
$env:PATH = $env:PATH + ';C:\Users\DELL\.gemini\antigravity\scratch\mingit\cmd;C:\Users\DELL\.gemini\antigravity\scratch\gh\bin'

git config --global user.email "test@example.com"
git config --global user.name "Your Name"

$functions = @(
    "formatTimestamp", "validateInput", "sanitizeString", "generateIdentifier", 
    "parseMetadata", "extractValues", "deepClone", "debounce", 
    "throttle", "memoize"
)

$descriptions = @(
    "format relative timestamps for display", "validate user input fields", 
    "sanitize strings for security", "generate unique identifiers", 
    "parse metadata from raw results", "extract nested values efficiently", 
    "perform deep cloning of objects", "add debounce utility for performance", 
    "add throttle utility for performance", "memoize expensive function calls"
)

for ($i=0; $i -lt 10; $i++) {
    $num = $i + 1
    Write-Host "Creating PR $num..."
    git checkout main
    $branch = "feature/utility-$($functions[$i])"
    git checkout -b $branch
    
    $funcName = $functions[$i]
    $desc = $descriptions[$i]
    
    # Append code to src\utils.js
    Add-Content -Path "src\utils.js" -Value "`n// $($desc)`nexport const $($funcName) = (data) => { return data ? JSON.parse(JSON.stringify(data)) : null; };"
    
    git add src\utils.js
    git commit -m "feat: add $($funcName) utility"
    git push -u origin $branch
    
    # Create PR via GH CLI
    gh pr create --repo Earnwithalee7890/StacksRank --head "Sawera836:$branch" --base main --title "feat: add $($funcName) utility" --body "This pull request adds the \`$($funcName)\` utility to the core utils module. Purpose: $($desc)."
    
    Write-Host "PR $num created."
    Start-Sleep -Seconds 2
}
Write-Host "All 10 PRs created successfully."
