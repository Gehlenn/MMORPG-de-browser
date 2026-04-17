# Deploy Script for Staging Environment
# Legacy of Komodo MMORPG v0.4.0
# Run: .\scripts\deploy-staging.ps1

param(
    [string]$Version = "0.4.0",
    [string]$Environment = "staging",
    [switch]$SkipTests = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$DeployDir = "deployments\staging-$Timestamp"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Legacy of Komodo - Staging Deploy v$Version" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Pre-flight checks
Write-Host "[1/7] Pre-flight checks..." -ForegroundColor Yellow

# Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Error "Node.js not found. Please install Node.js 18+"
    exit 1
}
Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green

# Check git
$gitStatus = git status --porcelain 2>$null
if ($gitStatus) {
    Write-Warning "Uncommitted changes detected:"
    Write-Host $gitStatus
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') { exit 1 }
}
Write-Host "  ✓ Git status checked" -ForegroundColor Green

# Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host ""
    Write-Host "[2/7] Running tests..." -ForegroundColor Yellow
    
    npm test -- tests/v0.4.0/ai-integration.test.js 2>&1 | ForEach-Object {
        if ($_ -match "Tests:\s+(\d+) passed") {
            Write-Host "  ✓ Tests passed: $($matches[1])" -ForegroundColor Green
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed. Fix before deploying."
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[2/7] Skipping tests (--SkipTests)" -ForegroundColor Yellow
}

# Build/deploy
Write-Host ""
Write-Host "[3/7] Preparing deployment package..." -ForegroundColor Yellow

if (-not $DryRun) {
    # Create deployment directory
    New-Item -ItemType Directory -Force -Path $DeployDir | Out-Null
    
    # Copy files
    $exclude = @('.git', 'node_modules', '.planning', 'deployments', 'tests', 'backups', '.jest-cache')
    Get-ChildItem -Path . -Exclude $exclude | Copy-Item -Destination $DeployDir -Recurse -Force
    
    Write-Host "  ✓ Files copied to $DeployDir" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would copy files to $DeployDir" -ForegroundColor Magenta
}

# Environment setup
Write-Host ""
Write-Host "[4/7] Setting up staging environment..." -ForegroundColor Yellow

$envContent = @"
NODE_ENV=staging
PORT=3001
VERSION=$Version
SOCKET_CORS_ORIGIN=*
LOG_LEVEL=debug
AI_BROADCAST_INTERVAL=500
AI_MAX_ENTITIES=100
"@

if (-not $DryRun) {
    $envContent | Out-File -FilePath "$DeployDir\.env.staging" -Encoding UTF8
    Write-Host "  ✓ Created .env.staging" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would create .env.staging" -ForegroundColor Magenta
}

# Install dependencies in deploy dir
Write-Host ""
Write-Host "[5/7] Installing dependencies..." -ForegroundColor Yellow

if (-not $DryRun) {
    Set-Location $DeployDir
    npm ci --production 2>&1 | Select-Object -Last 5
    Set-Location ..
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would run: npm ci --production" -ForegroundColor Magenta
}

# Create startup script
Write-Host ""
Write-Host "[6/7] Creating startup script..." -ForegroundColor Yellow

$startupScript = @"
@echo off
echo Starting Legacy of Komodo Staging Server v$Version
echo Port: 3001
echo Environment: staging
echo.
set NODE_ENV=staging
set PORT=3001
node server/server.js
"@

if (-not $DryRun) {
    $startupScript | Out-File -FilePath "$DeployDir\start-staging.bat" -Encoding ASCII
    Write-Host "  ✓ Created start-staging.bat" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would create start-staging.bat" -ForegroundColor Magenta
}

# Deployment summary
Write-Host ""
Write-Host "[7/7] Deployment summary..." -ForegroundColor Yellow
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  STAGING DEPLOY READY!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Version:     v$Version" -ForegroundColor White
Write-Host "Directory:   $DeployDir" -ForegroundColor White
Write-Host "Port:        3001" -ForegroundColor White
Write-Host "Environment: staging" -ForegroundColor White
Write-Host ""

if (-not $DryRun) {
    Write-Host "To start the server:" -ForegroundColor Cyan
    Write-Host "  cd $DeployDir" -ForegroundColor White
    Write-Host "  .\start-staging.bat" -ForegroundColor White
    Write-Host ""
    Write-Host "Or with npm:" -ForegroundColor Cyan
    Write-Host "  cd $DeployDir" -ForegroundColor White
    Write-Host "  npm start" -ForegroundColor White
} else {
    Write-Host "[DRY RUN] No files were actually created." -ForegroundColor Magenta
    Write-Host "Run without -DryRun to perform actual deployment." -ForegroundColor Magenta
}

Write-Host ""
Write-Host "Manual QA Checklist:" -ForegroundColor Yellow
Write-Host "  [ ] Press F9 - debug overlay appears" -ForegroundColor Gray
Write-Host "  [ ] Attack mob - threat meter shows" -ForegroundColor Gray
Write-Host "  [ ] Boss phase change - notification appears" -ForegroundColor Gray
Write-Host "  [ ] 50+ mobs - FPS stays at 60" -ForegroundColor Gray
Write-Host ""
