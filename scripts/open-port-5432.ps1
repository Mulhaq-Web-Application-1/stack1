# Run this script as Administrator to allow outbound TCP on port 5432 (Neon Postgres).
# Right-click -> Run with PowerShell (as Admin), or: Start-Process powershell -Verb RunAs -ArgumentList '-File', (Resolve-Path .\open-port-5432.ps1).Path

$ruleName = "PostgreSQL (Neon) outbound"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Rule '$ruleName' already exists. Removing and re-adding..."
  Remove-NetFirewallRule -DisplayName $ruleName
}
New-NetFirewallRule -DisplayName $ruleName -Direction Outbound -Action Allow -Protocol TCP -RemotePort 5432
Write-Host "Done. Outbound TCP to port 5432 is now allowed (e.g. Neon Postgres)."
