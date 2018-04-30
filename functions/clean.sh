#!/bin/bash
# deletes ALL data created by addFakePoster

# fail quickly in the case of error
# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail

COLLECTION="items"
BUCKET_PATH="images"
JUST_DO_IT=false
delete_everything() {
  echo "deleting all from firestore 'items'"
  firebase firestore:delete -r -y $COLLECTION

  # note: deleting from storage not available in Firebase CLI
  #       https://github.com/firebase/firebase-tools/issues/752
  # gsutil command handles this nicely!
  # https://cloud.google.com/storage/docs/gsutil/commands/rm
  echo "deleting all from storaage '${BUCKET_PATH}'"
  gsutil rm "gs://$PROJECT_ID.appspot.com/${BUCKET_PATH}/*"
}

confirm() {
  read -r -p "Do you want to delete firestore '${COLLECTION}/*' and storage '${BUCKET_PATH}/*' ? [y/N] " response
  case "$response" in
      [yY])
          true
          ;;
      *)
          false;
          ;;
  esac
}

usage() {
  echo "./clean     # deletes everything created by addFakePoster"
  echo "./clean -y  # skips confirmation"
}

while getopts “hy” OPTION
do
     case $OPTION in
         h)
             usage
             exit
             ;;
         y)
            JUST_DO_IT=true;
            ;;
         ?)
             usage
             exit
             ;;
     esac
done

$JUST_DO_IT && delete_everything && exit

confirm && delete_everything
