import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as fs from 'fs'
import * as os from 'os'
import * as faker from 'faker';
import * as Twitter from 'twitter'
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

  let colors = "black purple indigo blue navy aquamarine green yellow gold orange red".split(' ')
  const colorArg = req.query['color'];
  if (colorArg) colors = [colorArg];    // override

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
  let colorizedFile = '';
  try {
    const imageMaker = new ImageMaker();
    imageResults = await imageMaker.make(imageOptions);
    console.log('imageMaker.make results:', imageResults);
    let datafile =  imageResults.localPath;  // reference to the one we're uploading
    const posterPromises = colors.map(async color => {
      console.log('color=',color);
      if (color !== 'black') {
        colorizedFile = await imageMaker.colorize(color, imageResults.localPath, imageResults.baseName);
        datafile = colorizedFile;
        console.log('colorizedFile:', colorizedFile);
      }

      // posterFile = await imageMaker.addCaption(message,
      //                                             imageResults.baseName,
      //                                             imageResults.localPath);

      const docRef = itemsColl.doc();
      // Upload to Storage with the same name as the id of the doc to be created
      const storagePath = `images/${docRef.id}.png`;
      const uploadOptions = { destination: storagePath };
      const bucket = admin.storage().bucket();
      const files = await bucket.upload(datafile, uploadOptions);

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
        style: "Julia Set",
        created: new Date(),
        storagePath: storagePath,
        url: downloadUrl[0]
      }
      await docRef.set(docData);
      return docData;
    })
    const results = await Promise.all(posterPromises);

    res.json(results);
  }
  catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
  finally {
    if (imageResults) {
      console.log(`Deleting image: ${imageResults.localPath}`);
      fs.unlinkSync(imageResults.localPath);
    }
    if (posterFile !== '') {
      console.log(`Deleting posterFile: ${posterFile}`);
      fs.unlinkSync(posterFile);
    }
    if (colorizedFile !== '') {
      console.log(`Deleting colorizedFile: ${colorizedFile}`);
      fs.unlinkSync(colorizedFile);
    }
  }
});


exports.tweetNewItems = functions.firestore.document(`disabled/none`).onCreate((snapshot, context) => {
  return null
})

let twitter

if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === "tweetNewItems") {
  try {
    const credentials = fs.readFileSync('./twitterCredentials.json').toString();
    const twitterCredentials = JSON.parse(credentials);
    twitter = new Twitter(twitterCredentials);
    console.log("Twitter configured");
    exports.tweetNewItems = functions.firestore.document('items/{id}').onCreate(_tweetNewItems);
  }
  catch (err) {
    console.warn('Twitter disabled', err)
  }
}

async function _tweetNewItems(snapshot: FirebaseFirestore.DocumentSnapshot, context: functions.EventContext) {
  const id = context.params.id;
  const data = snapshot.data();
  if (!data.storagePath) {
    console.error(`Item ${id} added with no storagePath`);
    return null;
  }

  const storageFile = admin.storage().bucket().file(data.storagePath);
  const posterUrl = `https://${adminConfig.projectId}.firebaseapp.com/posters/${id}`;

  try {
    const buffer = await storageFile.download();
    const response = await twitter.post('media/upload', { media: buffer });
    const mediaId = response.media_id_string;

    const tweet = await twitter.post('statuses/update', {
      status: `Take a look at our latest poster "${data.message}"\n${posterUrl}`,
      media_ids: mediaId
    });
    console.log(tweet);
  }
  catch (err) {
    console.error(err);
  }
}
