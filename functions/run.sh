#!/bin/bash

# fail quickly in the case of error
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail

for i in `seq 2 6`;
do
  echo d=$i
  curl https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster?d=$i && echo "  completed d=$i" &
done

