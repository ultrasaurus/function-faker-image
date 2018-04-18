



```
PROJECT_ID=function-faker-image
firebase functions:config:set project.id=$PROJECT_ID
firebase functions:config:set storage.bucket=$PROJECT_ID.appspot.com
cd functions
npm run build
firebase deploy --only functions
curl https://us-central1-$PROJECT_ID.cloudfunctions.net/newImage

# to only deploy a single function
firebase deploy --only functions:newImage
```

