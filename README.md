##



## Dev Setup

Create a Firebase project and:

1. set up billing
2. Enable Firestore (in Database section) & Storage
3. Create a service account for your project in the Firebase console, save it in functions/serviceAccount.json

### Clone project

```
git clone --recurse-submodules git@github.com:ultrasaurus/function-faker-image.git
cd function-faker-image
```

```
firebase use --add [YOUR-PROJECT-ID]
cd functions
npm install
npm run build
firebase deploy --only functions

curl https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/addFakePoster
curl https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/addFakePoster?d=5
```

