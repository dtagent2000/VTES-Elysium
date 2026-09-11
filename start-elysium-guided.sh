#!/usr/bin/env bash
# Elysium server guided launcher (macOS / Linux) - mirror of start-elysium-guided.bat.
# Asks a few questions, then starts the server with the right options.
# The plain start-elysium.sh stays the zero-questions default.
# First run: make it executable once with   chmod +x start-elysium-guided.sh
# (or start it with   bash start-elysium-guided.sh   which needs no chmod).
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
echo "  Elysium server -- guided start"
echo "  ------------------------------"
echo "  A few questions, then the server starts with the right options."
echo "  Press Enter to skip any question (skipped = off, same as the plain launcher)."
echo

ARGS=()
SHOWN=""

read -r -p "  Server password (locks the WHOLE server -- browse/create/join): " SRVPASS
if [ -n "${SRVPASS}" ]; then
  ARGS+=(--server-pass "${SRVPASS}")
  SHOWN="${SHOWN} --server-pass ***"
fi

read -r -p "  Admin password (tournament referees inherit all host powers): " ADMPASS
if [ -n "${ADMPASS}" ]; then
  ARGS+=(--admin-pass "${ADMPASS}")
  SHOWN="${SHOWN} --admin-pass ***"
  read -r -p "  Single-room server -- only the admin may create rooms? [y/N] " ONEROOM
  case "${ONEROOM}" in [yY]*) ARGS+=(--create-policy admin); SHOWN="${SHOWN} --create-policy admin";; esac
fi

read -r -p "  Behind cloudflared/Caddy running on THIS machine? (--trust-proxy) [y/N] " PROXY
case "${PROXY}" in [yY]*) ARGS+=(--trust-proxy); SHOWN="${SHOWN} --trust-proxy"; echo "  Remember: start the tunnel separately with start-cloudflare-tunnel once the server is up.";; esac

echo
echo "  Starting: node elysium-server.js${SHOWN}"
echo "  (press Ctrl+C or close this window to stop the server)"
echo
node elysium-server.js ${ARGS[@]+"${ARGS[@]}"}   # the ${arr[@]+...} form is the bash-3.2-safe empty-array expansion under set -u -- macOS still ships bash 3.2, where a bare "${ARGS[@]}" on an empty array aborts with "unbound variable"
echo
echo "  Server stopped."
read -r -p "  Press Enter to close. " _
