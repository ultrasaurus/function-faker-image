import * as functions from 'firebase-functions';

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
