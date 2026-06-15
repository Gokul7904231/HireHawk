#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# deploy_azure_mcp.sh — Deploy all 5 NeuroHire MCP servers to Azure Functions
# Usage: bash deploy_azure_mcp.sh <resource-group> <storage-account>
# Requirements: az cli, azure-functions-core-tools (func)
# ──────────────────────────────────────────────────────────────────────────────
set -e

RESOURCE_GROUP="${1:-neurohire-rg}"
STORAGE_ACCOUNT="${2:-neurohirestorage}"
LOCATION="eastus"
PYTHON_VERSION="3.11"

MCP_SERVERS=(
  "jd_parser_mcp:jd-parser-mcp:8002"
  "resume_mcp:resume-mcp:8001"
  "company_intel_mcp:company-intel-mcp:8004"
  "outreach_mcp:outreach-mcp:8005"
  "tracker_mcp:tracker-mcp:8003"
)

echo "=== NeuroHire MCP Azure Functions Deployment ==="
echo "Resource group : $RESOURCE_GROUP"
echo "Storage account: $STORAGE_ACCOUNT"
echo "Location       : $LOCATION"
echo ""

# 1. Create resource group (idempotent)
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
echo "[✓] Resource group ready"

# 2. Create storage account (idempotent)
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --output none
echo "[✓] Storage account ready"

# 3. Deploy each MCP server as a separate Function App
for entry in "${MCP_SERVERS[@]}"; do
  IFS=":" read -r dir_name app_name port <<< "$entry"
  echo ""
  echo "--- Deploying $app_name ---"
  
  APP_NAME="neurohire-${app_name}"
  MCP_DIR="neurohire/mcp_servers/${dir_name}"
  
  # Create Function App
  az functionapp create \
    --resource-group "$RESOURCE_GROUP" \
    --consumption-plan-location "$LOCATION" \
    --runtime python \
    --runtime-version "$PYTHON_VERSION" \
    --functions-version 4 \
    --name "$APP_NAME" \
    --storage-account "$STORAGE_ACCOUNT" \
    --os-type linux \
    --output none
  
  # Set environment variables
  az functionapp config appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
      MOCK_MODE=false \
      PORT="$port" \
    --output none
  
  # Deploy code from mcp_servers directory
  (cd "$MCP_DIR" && func azure functionapp publish "$APP_NAME" --python)
  
  # Get the live URL
  LIVE_URL=$(az functionapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostName" -o tsv)
  
  echo "[✓] $app_name deployed: https://$LIVE_URL"
done

echo ""
echo "=== All MCP servers deployed ==="
echo ""
echo "Next step: Update Render environment variables with the Azure Function URLs:"
echo "  JD_PARSER_MCP_URL     = https://neurohire-jd-parser-mcp.azurewebsites.net"
echo "  RESUME_MCP_URL        = https://neurohire-resume-mcp.azurewebsites.net"
echo "  COMPANY_INTEL_MCP_URL = https://neurohire-company-intel-mcp.azurewebsites.net"
echo "  OUTREACH_MCP_URL      = https://neurohire-outreach-mcp.azurewebsites.net"
echo "  TRACKER_MCP_URL       = https://neurohire-tracker-mcp.azurewebsites.net"
