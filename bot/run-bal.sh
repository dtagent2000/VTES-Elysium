#!/bin/bash
# usage: ./run-bal.sh N   (N = 1..12, line N of serie-bal1/design.txt)
cd /home/claude/w; N=$1; D=$(sed -n "${N}p" serie-bal1/design.txt)
node elysium-bot-arena.js --matches 1 --bots 4 --decks $D --fixed-seats --start-pool 30 --match-timeout 600 --seed $((5000+N)) --trace ./serie-bal1 > serie-bal1/run-$N.log 2>&1
echo "done $N $D $(date +%T)" >> serie-bal1/progress.txt
