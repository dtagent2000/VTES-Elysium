#!/usr/bin/env bash
# Elysium - Cloudflare quick-tunnel launcher (macOS / Linux).
# Opens a public tunnel to the local Elysium server (port 8123) and prints the
# https://....trycloudflare.com address prominently. Ctrl+C stops the tunnel.
# First run: chmod +x start-cloudflare-tunnel.sh   (or: bash start-cloudflare-tunnel.sh)
set -u
cd "$(dirname "$0")"
CF="cloudflared"
if ! command -v "$CF" >/dev/null 2>&1; then
  if [ -x "./cloudflared" ]; then CF="./cloudflared"; else
    echo
    echo "  cloudflared was not found on your PATH or in this folder."
    echo "    macOS:          brew install cloudflared"
    echo "    Debian/Ubuntu:  see https://pkg.cloudflare.com (apt repo) or the release below"
    echo "    Any Linux:      download from https://github.com/cloudflare/cloudflared/releases/latest ,"
    echo "                    save it next to this file as ./cloudflared and: chmod +x cloudflared"
    echo
    exit 1
  fi
fi
echo
echo "  Starting Cloudflare tunnel to http://localhost:8123 ..."
echo "  Waiting for the public address (usually 5-15 seconds) ..."
echo
# Stream cloudflared's output; loudly echo the REAL url line when it appears.
# (The earlier 'Requesting ... trycloudflare.com' line must not trigger - we
#  require https://, same rule as the .bat.)
"$CF" tunnel --url http://localhost:8123 2>&1 | while IFS= read -r line; do
  printf '%s\n' "$line"
  case "$line" in
    *https://*trycloudflare.com*)
      url=$(printf '%s\n' "$line" | grep -o 'https://[a-zA-Z0-9.-]*trycloudflare.com')
      if [ -n "${url:-}" ]; then
        echo
        echo "  ==========================================================="
        echo "  PUBLIC ADDRESS:  $url"
        echo "  Share this with your players. Ctrl+C here stops the tunnel."
        echo "  ==========================================================="
        echo
        if command -v pbcopy >/dev/null 2>&1; then printf '%s' "$url" | pbcopy && echo "  (copied to the clipboard)"; 
        elif command -v xclip  >/dev/null 2>&1; then printf '%s' "$url" | xclip -selection clipboard && echo "  (copied to the clipboard)"; fi
        echo
      fi;;
  esac
done
