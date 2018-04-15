import * as functions from 'firebase-functions';

import * as admin from 'firebase-admin';
import Storage = require('@google-cloud/storage');
const spawn = require('child-process-promise').spawn;

const IMAGE_WIDTH = 600;
const IMAGE_HEIGHT = 400;

admin.initializeApp(functions.config().firebase);

function getConfig() {
  const config = functions.config();
  console.log('using config', config);
   return config;
}

export const newImage = functions.https.onRequest((request, response) => {
  const config = getConfig();
  console.log('got config');
  const storage = Storage({
    projectId: config.projectId,
    keyFilename: 'storage-credential.json'
  });

  console.log('Storate init complete');
  const bucket = storage.bucket(config.storage.bucket);
  console.log('Storate bucket', bucket);

  const metadata = {
    contentType: 'image/png',
    // To enable Client-side caching you can set the Cache-Control headers here. Uncomment below.
    // 'Cache-Control': 'public,max-age=3600',
  };

  const tempLocalFile = 'fractastic/examples/julia1.png';
  console.log('checking', tempLocalFile);

  return spawn('ls', ['.'], { capture: [ 'stdout', 'stderr' ]})
  .then(function (result) {
      console.log('[spawn] stdout: ', result.stdout.toString());
  })
  .then(() => {
    return bucket.upload(tempLocalFile, {destination: '/test/julia1.png', metadata: metadata}).then(() => {
      return response.send("Ok!");
    });
  })
  .catch(function (err) {
    console.error('err: ', err);
  });


 });

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});
