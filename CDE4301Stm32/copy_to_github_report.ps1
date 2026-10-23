<#
.SYNOPSIS
    Copies the CDE4301Stm32 folder to Github report directory.
.DESCRIPTION
    Uses robocopy to efficiently copy the project files while excluding
    heavy build and cache folders (.pio, .cache, __pycache__, .git).
#>

$SourceDir = $PSScriptRoot
$DestDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\Github report\CDE4301Stm32"))

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Copying CDE4301Stm32 to Github report..." -ForegroundColor Cyan
Write-Host " Source:      $SourceDir"
Write-Host " Destination: $DestDir"
Write-Host "===================================================" -ForegroundColor Cyan

if (-not (Test-Path -Path $DestDir)) {
    Write-Host "Creating destination directory..."
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
}

$excludeDirs = @(".pio", ".cache", "__pycache__", ".git")
$excludeFiles = @("*.bak", "*.pyc")

robocopy $SourceDir $DestDir /E /XD $excludeDirs /XF $excludeFiles /R:1 /W:1

if ($LASTEXITCODE -le 3) {
    Write-Host "`nCopy completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nRobocopy exited with code $LASTEXITCODE." -ForegroundColor Yellow
}
