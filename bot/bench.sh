#!/bin/bash
# bench.sh ARM WORKER NWORKERS N [SPEC] -- the mirror bench (design Part 5), resumable: a match is skipped once bench-ARM/done-I exists.
#   Match I: design line ((I-1)%12)+1 of serie-cmb1/design.txt, variant seat P = ((I-1)/12)%4+1, seed 9100+I (the same in every arm).
#   SPEC: 'none' (negative control), 'persona=novice' (positive control), or 'knob=key=val' (a variant under test).
cd /home/claude/w; ARM=$1; W=$2; NW=$3; N=$4; SPEC=${5:-none}; DECK=${6:-}; BASE=${7:-}; mkdir -p bench-$ARM   # optional 7th arg: a GLOBAL knob for every seat (the baseline), e.g. twdKnow=0 once the bot's default flipped to 1   # optional 6th arg: a deck name -- the variant seat is wherever THAT deck sits in the design line (measures a deck-specific rule)
for I in $(seq 1 $N); do
  [ $(( (I-1) % NW )) -ne $W ] && continue
  [ -f bench-$ARM/done-$I ] && continue
  D=$(sed -n "$(( (I-1) % 12 + 1 ))p" serie-cmb1/design.txt); P=$(( ((I-1)/12) % 4 + 1 ))
  [ -n "$DECK" ] && P=$(echo $D | tr ',' '\n' | grep -n "^$DECK$" | cut -d: -f1)
  PERS="expert,expert,expert,expert"; KN=""
  case "$SPEC" in persona=*) PERS=$(echo "expert,expert,expert,expert" | awk -F, -v p=$P -v v=${SPEC#persona=} 'BEGIN{OFS=","}{$p=v; print}');; knob=*) KN="--knob $P:${SPEC#knob=}";; esac
  [ -n "$BASE" ] && KN="--knob $BASE $KN"   # the global knob first; the seat knob overrides it (the arena spreads the seat knobs last)
  mkdir -p bench-$ARM/m$I
  node elysium-bot-arena.js --matches 1 --bots 4 --decks $D --personas $PERS --fixed-seats --start-pool 30 --match-timeout 600 --seed $((9100+I)) --trace ./bench-$ARM/m$I $KN > bench-$ARM/m$I/run.log 2>&1
  echo "$P" > bench-$ARM/m$I/variant-seat; touch bench-$ARM/done-$I
done
