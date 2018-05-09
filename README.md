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
git submodule update --init
```

```
export PROJECT_ID=your-project-id
firebase use --add $PROJECT_ID
cd functions
npm install
npm run build
firebase deploy --only functions

curl https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster
curl https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster?d=5
curl "https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster?d=2&cre=0.9&cim=0.5&c=12&x_min=-2.2&x_max=1.8&y_min=-1.9&y_max=1.7"
```

to remove all the data created by addFakePoster
```
./functions/clean.sh -y
```

## To create many variations of Julia Set fractal images

The variations are based on a generated series of input parameters,
so the variations are consistent each time the script is run.
```
node lib/add-posters.js -u "https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster" -j
```

you can also specify
```
 -s start at
 -e end at
 -b batch size
 -w wait time (in milliseconds)
```

For example:
```
node lib/add-posters.js -u "https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster" -t j -b 4 -s 2 -e 12

node lib/add-posters.js -u "https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster" -t j -b 400 -e 800 -w 1000


node lib/add-posters.js -u https://us-central1-$PROJECT_ID.cloudfunctions.net/addFakePoster -t m -b 4 -s 0 -e 5

```
