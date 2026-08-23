# Ejecutar en una PowerShell ABIERTA COMO ADMINISTRADOR.
# Restablece la contraseña del usuario postgres a "postgres" y crea la base "picacho".
# Version pausada: usa Stop-Service + Start-Service por separado, con esperas generosas,
# en vez de Restart-Service (que fallaba por timeout al encadenar dos reinicios rapidos).

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$pgData = "C:\Program Files\PostgreSQL\17\data"
$hba = "$pgData\pg_hba.conf"

function Wait-ForPostgres {
    param([int]$TimeoutSeconds = 60)
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $test = Test-NetConnection -ComputerName "localhost" -Port 5432 -WarningAction SilentlyContinue
        if ($test.TcpTestSucceeded) { return $true }
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    return $false
}

Write-Host "1) Deteniendo el servicio..."
Stop-Service postgresql-x64-17
Start-Sleep -Seconds 5
Get-Service postgresql-x64-17

Write-Host "2) Editando pg_hba.conf a trust..."
Copy-Item $hba "$hba.bak" -Force
(Get-Content $hba) -replace 'scram-sha-256', 'trust' | Set-Content $hba -Encoding utf8

Write-Host "3) Iniciando el servicio (trust)..."
Start-Service postgresql-x64-17
if (-not (Wait-ForPostgres -TimeoutSeconds 60)) {
    Write-Host "ERROR: Postgres no respondio. Revirtiendo pg_hba.conf."
    Copy-Item "$hba.bak" $hba -Force
    Remove-Item "$hba.bak" -Force
    exit 1
}
Write-Host "Postgres respondiendo. Cambiando password y creando base..."

& "$pgBin\psql.exe" -U postgres -h localhost -c "ALTER USER postgres PASSWORD 'postgres';"
& "$pgBin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE picacho;"

Write-Host "4) Deteniendo el servicio para revertir pg_hba.conf..."
Stop-Service postgresql-x64-17
Start-Sleep -Seconds 5

Copy-Item "$hba.bak" $hba -Force
Remove-Item "$hba.bak" -Force

Write-Host "5) Iniciando el servicio (scram-sha-256, config original)..."
Start-Service postgresql-x64-17
Wait-ForPostgres -TimeoutSeconds 60 | Out-Null
Get-Service postgresql-x64-17

Write-Host "Listo."
