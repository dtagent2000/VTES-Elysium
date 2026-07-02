#!/usr/bin/env bash
# Elysium server launcher (macOS / Linux) - mirror of start-elysium.bat.
# First run: make it executable once with   chmod +x start-elysium.sh
# (or start it with   bash start-elysium.sh   which needs no chmod).
set -u
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js was not found on this machine."
  echo "  Install the LTS version from https://nodejs.org and run this file again."
  echo "  (macOS with Homebrew:  brew install node    Debian/Ubuntu:  sudo apt install nodejs)"
  echo
  read -r -p "  Press Enter to close. " _
  exit 1
fi
echo
echo "  Starting the Elysium server -- press Ctrl+C (or close this window) to stop it."
echo
node elysium-server.js "$@"
echo
echo "  Server stopped."
read -r -p "  Press Enter to close. " _
