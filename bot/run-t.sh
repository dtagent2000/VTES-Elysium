#!/bin/bash
cd /home/claude/w; S=$1; N=$2; D=$(sed -n "${N}p" $S/design.txt)
T=$(echo $D | tr ',' '\n' | grep -n tremere | cut -d: -f1)
node elysium-bot-arena.js --matches 1 --bots 4 --decks $D --fixed-seats --start-pool 30 --match-timeout 600 --seed $((9980+N)) --trace ./$S --knob $T:combatMind=0 > $S/run-$N.log 2>&1
echo "done $N $D tremere-seat $T $(date +%T)" >> $S/progress.txt
