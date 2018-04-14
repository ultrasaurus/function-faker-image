import * as functions from 'firebase-functions';

import * as admin from 'firebase-admin';
//import * as Storage from '@google-cloud/storage';
import Storage = require('@google-cloud/storage');

admin.initializeApp(functions.config().firebase);

function getConfig() {
  const config = functions.config();
  console.log('using config', config);
   return config;
}

export const newImage = functions.https.onRequest((request, response) => {
  const config = getConfig();
  const storage = Storage({
    projectId: config.projectId,
    keyFilename: 'storage-credential.json'
  });
  const bucket = storage.bucket(config.storage.bucket);


  console.log('service account =', config.storage.credential)
  response.send("Ok!");
 });

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});
