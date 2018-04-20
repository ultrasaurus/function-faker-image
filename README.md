##



## Dev Setup

Create a Firebase project and set up billing, set PROJECT_ID in command-line
sequence below to *your* project id.

```
PROJECT_ID=function-faker-image
```

Create a service account for writing to Google Cloud Storage
It will need `Storge Object Admin` access to allow overwriting files -- create
as well as delete.

open https://pantheon.corp.google.com/apis/credentials/serviceaccountkey?project=$PROJECT_ID

save in json format: functions/storage-credential.json


### Clone project



```
git clone --recurse-submodules git@github.com:ultrasaurus/function-faker-image.git
cd function-faker-image
```

```
firebase functions:config:set project.id=$PROJECT_ID
firebase functions:config:set storage.bucket=$PROJECT_ID.appspot.com
cd functions
npm install
npm run build
firebase deploy --only functions
curl https://us-central1-$PROJECT_ID.cloudfunctions.net/newImage

# to only deploy a single function
firebase deploy --only functions:newImage
```

