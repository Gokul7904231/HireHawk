# run_all_mock.ps1
# Starts/stops all 5 NeuroHire MCP servers locally in MOCK_MODE=true

$Env:MOCK_MODE = "true"

function Start-Servers {
    Write-Host "Starting 5 MCP servers in MOCK_MODE=true..." -ForegroundColor Cyan

    $Processes = @()
    $Servers = @(
        @{ Name = "resume-mcp"; Port = 8001; Dir = "resume_mcp" },
        @{ Name = "jd-parser-mcp"; Port = 8002; Dir = "jd_parser_mcp" },
        @{ Name = "tracker-mcp"; Port = 8003; Dir = "tracker_mcp" },
        @{ Name = "company-intel-mcp"; Port = 8004; Dir = "company_intel_mcp" },
        @{ Name = "outreach-mcp"; Port = 8005; Dir = "outreach_mcp" }
    )

    $BaseDir = Get-Location
    $Env:PYTHONPATH = "$BaseDir"

    foreach ($S in $Servers) {
        $Cwd = Join-Path $BaseDir "mcp_servers\$($S.Dir)"
        Write-Host "Launching $($S.Name) on port $($S.Port) in $Cwd..." -ForegroundColor Yellow
        # Start uvicorn as a background process
        $Proc = Start-Process -FilePath "..\..\venv\Scripts\python.exe" -ArgumentList "-m uvicorn main:app --port $($S.Port)" -WorkingDirectory $Cwd -PassThru -NoNewWindow
        $Processes += $Proc
    }

    # Write PIDs to file
    $Pids = $Processes | ForEach-Object { $_.Id }
    $Pids -join " " | Out-File -FilePath (Join-Path $BaseDir ".server_pids") -Encoding ascii

    Write-Host "PIDs: $($Pids -join ', ')" -ForegroundColor Green
    Write-Host "Waiting for all /health endpoints to return 200..." -ForegroundColor Yellow

    foreach ($S in $Servers) {
        $Url = "http://localhost:$($S.Port)/health"
        $Ready = $false
        for ($i = 0; $i -lt 30; $i++) {
            try {
                $Resp = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 1
                if ($Resp.status -eq "ok") {
                    $Ready = $true
                    break
                }
            } catch {
                # Ignore and retry
            }
            Start-Sleep -Milliseconds 500
        }
        if ($Ready) {
            Write-Host "Server $($S.Name) on port $($S.Port) is healthy." -ForegroundColor Green
        } else {
            Write-Warning "Server $($S.Name) on port $($S.Port) failed health check!"
        }
    }
    Write-Host "All servers are ready." -ForegroundColor Green
}

function Stop-Servers {
    $PidFile = Join-Path (Get-Location) ".server_pids"
    if (Test-Path $PidFile) {
        $PidsText = Get-Content $PidFile
        $Pids = $PidsText -split " "
        Write-Host "Stopping servers with PIDs: $($Pids -join ', ')" -ForegroundColor Cyan
        foreach ($Pid in $Pids) {
            if ($Pid.Trim() -ne "") {
                try {
                    Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
                } catch {}
            }
        }
        Remove-Item $PidFile -ErrorAction SilentlyContinue
        Write-Host "Servers stopped." -ForegroundColor Green
    } else {
        Write-Host "No .server_pids file found. Searching for uvicorn processes..." -ForegroundColor Yellow
        Get-Process | Where-Object { $_.ProcessName -like "*python*" -or $_.CommandLine -like "*uvicorn*" } | ForEach-Object {
            try {
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            } catch {}
        }
        Write-Host "Done." -ForegroundColor Green
    }
}

$Action = $args[0]
if ($Action -eq "start") {
    Start-Servers
} elseif ($Action -eq "stop") {
    Stop-Servers
} else {
    Write-Host "Usage: .\run_all_mock.ps1 {start|stop}" -ForegroundColor Red
}
