param(
    [switch]$Release = $true
)

Write-Host "Building Torrent Client..." -ForegroundColor Cyan

if ($Release) {
    npm run tauri build
} else {
    npm run tauri build -- --debug
}

Write-Host "Build complete!" -ForegroundColor Green
