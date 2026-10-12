#!/bin/bash
# start run N detached unless running/done, then poll up to ~280 s
cd /home/claude/w; N=$1
grep -q "^done $N " serie-bal1/progress.txt || pgrep -f elysium-bot-arena >/dev/null || (setsid nohup ./run-bal.sh $N >/dev/null 2>&1 &)
for i in $(seq 1 28); do sleep 10; grep -q "^done $N " serie-bal1/progress.txt && break; done
tail -1 serie-bal1/progress.txt
