# deploy_azure_mcp.ps1 — Deploy all 5 HireHawk MCP servers to Azure Functions
# Usage: .\deploy_azure_mcp.ps1 [-ResourceGroup "hirehawk-rg"] [-StorageAccount "hirehawkstorage"]
param(
    [string]$ResourceGroup = "hirehawk-rg",
    [string]$StorageAccount = "hirehawkstorage",
    [string]$Location = "eastus"
)

$ErrorActionPreference = "Stop"

$McpServers = @(
    @{ Dir = "jd_parser_mcp";     App = "jd-parser-mcp";     Port = 8002 }
    @{ Dir = "resume_mcp";        App = "resume-mcp";         Port = 8001 }
    @{ Dir = "company_intel_mcp"; App = "company-intel-mcp";  Port = 8004 }
    @{ Dir = "outreach_mcp";      App = "outreach-mcp";       Port = 8005 }
    @{ Dir = "tracker_mcp";       App = "tracker-mcp";        Port = 8003 }
)

Write-Host "=== HireHawk MCP Azure Functions Deployment ===" -ForegroundColor Cyan
Write-Host "Resource group : $ResourceGroup"
Write-Host "Storage account: $StorageAccount"
Write-Host "Location       : $Location`n"

# 1. Create resource group
Write-Host "Creating resource group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
Write-Host "[OK] Resource group ready" -ForegroundColor Green

# 2. Create storage account
Write-Host "Creating storage account..." -ForegroundColor Yellow
az storage account create `
    --name $StorageAccount `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Standard_LRS `
    --output none
Write-Host "[OK] Storage account ready" -ForegroundColor Green

$LiveUrls = @{}

# 3. Deploy each MCP server
foreach ($mcp in $McpServers) {
    Write-Host "`n--- Deploying $($mcp.App) ---" -ForegroundColor Cyan
    $AppName = "hirehawk-$($mcp.App)"
    $McpDir = "hirehawk\mcp_servers\$($mcp.Dir)"

    # Create Function App
    az functionapp create `
        --resource-group $ResourceGroup `
        --consumption-plan-location $Location `
        --runtime python `
        --runtime-version "3.11" `
        --functions-version 4 `
        --name $AppName `
        --storage-account $StorageAccount `
        --os-type linux `
        --output none

    # App settings
    az functionapp config appsettings set `
        --name $AppName `
        --resource-group $ResourceGroup `
        --settings "MOCK_MODE=false" "PORT=$($mcp.Port)" `
        --output none

    # Deploy code
    Push-Location $McpDir
    func azure functionapp publish $AppName --python
    Pop-Location

    # Get live URL
    $LiveHost = az functionapp show `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "defaultHostName" -o tsv
    
    $LiveUrl = "https://$LiveHost"
    $LiveUrls[$mcp.App] = $LiveUrl
    Write-Host "[OK] $($mcp.App) deployed: $LiveUrl" -ForegroundColor Green
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "`nAdd these to your Render environment variables:"
Write-Host "JD_PARSER_MCP_URL     = $($LiveUrls['jd-parser-mcp'])"
Write-Host "RESUME_MCP_URL        = $($LiveUrls['resume-mcp'])"
Write-Host "COMPANY_INTEL_MCP_URL = $($LiveUrls['company-intel-mcp'])"
Write-Host "OUTREACH_MCP_URL      = $($LiveUrls['outreach-mcp'])"
Write-Host "TRACKER_MCP_URL       = $($LiveUrls['tracker-mcp'])"
