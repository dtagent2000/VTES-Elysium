#!/bin/bash
# usage: run-ser.sh SERIE N [knobs]
cd /home/claude/w; S=$1; N=$2; K=$3; D=$(sed -n "${N}p" $S/design.txt)
node elysium-bot-arena.js --matches 1 --bots 4 --decks $D --fixed-seats --start-pool 30 --match-timeout 600 --seed $((9980+N)) --trace ./$S ${K:+--knob $K} > $S/run-$N.log 2>&1
echo "done $N $D $(date +%T)" >> $S/progress.txt
