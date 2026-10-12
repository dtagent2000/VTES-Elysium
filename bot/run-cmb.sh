#!/bin/bash
cd /home/claude/w; N=$1; D=$(sed -n "${N}p" serie-cmb1/design.txt)
node elysium-bot-arena.js --matches 1 --bots 4 --decks $D --fixed-seats --start-pool 30 --match-timeout 600 --seed $((9980+N)) --trace ./serie-cmb1 > serie-cmb1/run-$N.log 2>&1
echo "done $N $D $(date +%T)" >> serie-cmb1/progress.txt
