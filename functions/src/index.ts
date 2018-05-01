import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path'
import * as fs from 'fs'
import * as faker from 'faker';
import { ImageMaker } from './image-maker';
import * as serviceAccount from '../serviceAccount.json';

const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG)
adminConfig.credential = admin.credential.cert(<any>serviceAccount)
admin.initializeApp(adminConfig);


function randomPrice() {
  // 5-25
  const base_price = (Math.floor(Math.random() * 5) + 1)*5;
  return base_price + 0.99
}


export const newImage = functions.https.onRequest(async (request, response) => {
  const imageMaker = new ImageMaker();
  const result = await imageMaker.make({});
  console.log('fakeImage.make result', result);
  response.send(result);
});


export const addFakePoster = functions.https.onRequest(async (req, res) => {
  console.log('addFakePoster query', req.query);

  const color = req.query['color'] || 'black';
  let message = req.query['message'];
  let noun = req.query['noun'];
  if (!noun) noun = faker.company.bsNoun();
  const verb = faker.company.bsBuzz();
  const adjective = faker.company.bsAdjective();
  if (!message) {
    message = `${verb[0].toUpperCase()}${verb.slice(1)} ${adjective} ${noun}.`;
  }
  const imageOptions = req.query;
  imageOptions['message'] = message;

  const itemsColl = admin.firestore().collection('items');

  let imageResults: { localPath: string, baseName: string };
  let posterFile = '';
  try {
    const imageMaker = new ImageMaker();
    imageResults = await imageMaker.make(imageOptions);
    console.log('imageMaker.make results:', imageResults);
    posterFile = await imageMaker.addCaption(message,
                                                imageResults.baseName,
                                                imageResults.localPath);

    const docRef = itemsColl.doc();
    // Upload to Storage with the same name as the id of the doc to be created
    const storagePath = `images/${docRef.id}.png`;
    const uploadOptions = { destination: storagePath };
    const bucket = admin.storage().bucket();
    const files = await bucket.upload(posterFile, uploadOptions);

    // Generate a public download URL
    const downloadUrl = await files[0].getSignedUrl({
      action: 'read',
      expires: '2099-01-01'
    });

    // Add the doc data
    const docData = {
      topic: noun,
      message: message,
      price: randomPrice(),
      color: color,
      storagePath: storagePath,
      url: downloadUrl[0]
    }
    await docRef.set(docData);

    res.json(docData);
  }
  catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
  finally {
    if (imageResults) {
      console.log(`Deleting ${imageResults.localPath}`);
      fs.unlinkSync(imageResults.localPath);
    }
    if (posterFile !== '') {
      console.log(`Deleting ${posterFile}`);
      fs.unlinkSync(posterFile);
    }
  }
});
