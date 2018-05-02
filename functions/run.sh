#!/bin/bash

# fail quickly in the case of error
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail

# ARGS="d=3&cre=0.9&cim=0.5&c=12&x_min=-2.2&x_max=1.8&y_min=-1.9&y_max=1.7"

MIN=-2.0
MAX=2.0

# 4*16*8*133=68000
#
echo $PROJECT_ID
for d in 2; #3 5 6;
do
  echo d=$d
  for cre in $(seq -0.4 0.1 1.1) # 0.4
  do
    echo cre=$cre
    for cim in $(seq -0.1 0.1 0.6) # 0.6
    do
        echo cim=$cim
        sleep 1
        for shift in $(seq 0.0 0.1 2.6) # 0.0
        do
          for c in $(seq 10 5 40) # 20
          do
            min=$(echo "$MIN + ($shift*2)" | bc)
            max=$(echo $MAX - $shift | bc)
            ARGS="d=$d&cre=$cre&cim=$cim&c=$c&x_min=$min&x_max=$max&y_min=$min&y_max=$max"
            URL="https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster?${ARGS}"
            echo ${URL}
            curl -sS ${URL} | xargs -0 ./log.sh && echo "  completed ${ARGS}" &
          done
        done
    done
  done
done


