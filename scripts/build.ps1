#!/usr/bin/env pwsh
# Build completo do devsheet para o Wallpaper Engine (seção 30).
# Uso:  pwsh scripts/build.ps1   (ou  npm run build:wallpaper)

$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
  if (-not (Test-Path node_modules)) {
    Write-Host '==> Instalando dependências...' -ForegroundColor Cyan
    npm install
  }

  Write-Host '==> Validando conteúdo (Zod)...' -ForegroundColor Cyan
  npm run validate:content

  Write-Host '==> Typecheck...' -ForegroundColor Cyan
  npm run typecheck

  Write-Host '==> Testes...' -ForegroundColor Cyan
  npm test

  Write-Host '==> Build (single-file)...' -ForegroundColor Cyan
  npm run build

  Write-Host '==> Montando pacote do Wallpaper Engine...' -ForegroundColor Cyan
  node scripts/copy-to-wallpaper.mjs

  Write-Host 'OK: dist/ pronto para importar no Wallpaper Engine.' -ForegroundColor Green
}
finally {
  Pop-Location
}
