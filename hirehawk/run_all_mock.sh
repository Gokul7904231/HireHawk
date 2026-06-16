#!/bin/bash

# run_all_mock.sh
# Starts/stops all 5 HireHawk MCP servers locally in MOCK_MODE=true

MOCK_MODE=true
export MOCK_MODE

start_servers() {
  echo "Starting 5 MCP servers in MOCK_MODE=true..."
  
  # Start resume-mcp (8001)
  cd mcp_servers/resume_mcp && uvicorn main:app --port 8001 > resume_mcp.log 2>&1 &
  RESUME_PID=$!
  cd ../..
  
  # Start jd-parser-mcp (8002)
  cd mcp_servers/jd_parser_mcp && uvicorn main:app --port 8002 > jd_parser_mcp.log 2>&1 &
  JD_PID=$!
  cd ../..
  
  # Start tracker-mcp (8003)
  cd mcp_servers/tracker_mcp && uvicorn main:app --port 8003 > tracker_mcp.log 2>&1 &
  TRACKER_PID=$!
  cd ../..
  
  # Start company-intel-mcp (8004)
  cd mcp_servers/company_intel_mcp && uvicorn main:app --port 8004 > company_intel_mcp.log 2>&1 &
  INTEL_PID=$!
  cd ../..
  
  # Start outreach-mcp (8005)
  cd mcp_servers/outreach_mcp && uvicorn main:app --port 8005 > outreach_mcp.log 2>&1 &
  OUTREACH_PID=$!
  cd ../..

  echo "PIDs: resume=$RESUME_PID, jd=$JD_PID, tracker=$TRACKER_PID, intel=$INTEL_PID, outreach=$OUTREACH_PID"
  echo $RESUME_PID $JD_PID $TRACKER_PID $INTEL_PID $OUTREACH_PID > .server_pids
  
  echo "Waiting for all /health endpoints to return 200..."
  for port in 8001 8002 8003 8004 8005; do
    until curl -s http://localhost:$port/health | grep -q "ok"; do
      sleep 0.5
    done
    echo "Server on port $port is healthy."
  done
  echo "All servers are ready."
}

stop_servers() {
  if [ -f .server_pids ]; then
    PIDS=$(cat .server_pids)
    echo "Stopping servers with PIDs: $PIDS"
    kill $PIDS 2>/dev/null
    rm .server_pids
    echo "Servers stopped."
  else
    echo "No .server_pids file found. Searching for uvicorn processes..."
    pkill -f uvicorn 2>/dev/null
    echo "Done."
  fi
}

case "$1" in
  start)
    start_servers
    ;;
  stop)
    stop_servers
    ;;
  *)
    echo "Usage: $0 {start|stop}"
    exit 1
    ;;
esac
