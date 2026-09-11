#!/usr/bin/env bash
# macOS double-click launcher for the Cloudflare tunnel: Finder runs .command files in Terminal.
# First run only:  chmod +x start-cloudflare-tunnel.command start-cloudflare-tunnel.sh
# If macOS Gatekeeper complains about an unidentified file, right-click -> Open once.
cd "$(dirname "$0")"
exec bash ./start-cloudflare-tunnel.sh "$@"
