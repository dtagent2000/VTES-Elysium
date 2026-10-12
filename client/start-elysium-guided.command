#!/usr/bin/env bash
# macOS double-click launcher: Finder runs .command files in Terminal.
# First run only:  chmod +x start-elysium-guided.command start-elysium-guided.sh
# If macOS Gatekeeper complains about an unidentified file, right-click -> Open once.
cd "$(dirname "$0")"
exec bash ./start-elysium-guided.sh "$@"
