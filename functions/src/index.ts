import * as functions from 'firebase-functions';
import * as faker from 'faker'

import * as admin from 'firebase-admin';
import {ImageMaker} from './image-maker';

admin.initializeApp(functions.config().firebase);

function getConfig() {
  const config = functions.config();
  console.log('using config', config);
   return config;
}


export const newImage = functions.https.onRequest((request, response) => {
  const config = getConfig();
  console.log('got config');

  const bucketName =  config['storage'].bucket as string;
  let fakeImage = new ImageMaker(config['projectId'], bucketName);

  return fakeImage.make().then((result) => {
    console.log('fakeImage.make result', result);
    response.send(result);
  })

 });

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

const COLLECTION_NAME = 'items';

function addToCollection(obj: any) {
  let config = getConfig();
  let name = COLLECTION_NAME
  console.log('name', name);
  return admin.firestore()
              .collection(name)
              .add(obj).then(writeResult => {
                let result = {id: writeResult.id, collection:name, doc: obj};
                console.log(result);
                return result;
  });
}

export let addDocument = functions.https.onRequest((req, res) => {
  console.log('addDocument query', req.query);
  const name = req.query.name;
  const value = req.query.value;
  let obj = {};
  obj[name] = value;

  addToCollection(obj).then(result => {
    // Send back a message that we've succesfully written the message
    res.json(result);
  });
});

export let addFake = functions.https.onRequest((req, res) => {
  console.log('addFake query', req.query);
  const name = req.query.name || 'text';
  const value = faker.hacker.phrase();
  let obj = {};
  obj[name] = value;

  addToCollection(obj).then(result => {
    // Send back a message that we've succesfully written the message
    res.json(result);
  });
});


