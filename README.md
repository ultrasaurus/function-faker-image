## Function Faker Image

This project includes Cloud Functions that let you generate a large variation
of images based on fractal equations



## Dev Setup

Create a Firebase project and:

1. set up billing
2. Enable Firestore (in Database section) & Storage
3. [Create a service account](https://firebase.google.com/docs/admin/setup) for your project in the Firebase console, save it in functions/serviceAccount.json

### Clone project

```
git clone --recurse-submodules git@github.com:ultrasaurus/function-faker-image.git
cd function-faker-image
```

```
PROJECT_ID=your-project-id
firebase use --add $PROJECT_ID
cd functions
npm install
npm run build
firebase deploy --only functions

curl https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster
curl https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster?d=5
```

to remove all the data created by addFakePoster
```
./functions/clean.sh -y
```
