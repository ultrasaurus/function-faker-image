import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as faker from 'faker';
import * as Twitter from 'twitter';
import { ImageMaker } from './image-maker';
import { listAvailableFonts } from './system-info';
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

function deleteFiles(files: Array<string>) {
  files.forEach(async f => {
      try {
        console.log(`Deleting file: ${f}`);
        fs.unlinkSync(f);
      }
      catch {
        // ignore errors
      }
  })
}

export const addFakePoster = functions.https.onRequest(async (req, res) => {
  console.log('addFakePoster query', req.query);

  // make one poster
  let colors = "black purple indigo blue navy aquamarine green yellow gold orange red".split(' ')
  const colorArg = req.query['color'];
  if (colorArg) colors = [colorArg];    // override

  const type = req.query['type'] || 'J';
  const style = type == 'J' ? "Julia Set" : "Mandelbrot"

  let random_message = false;
  let message = req.query['message'];
  let noun = faker.company.bsNoun();
  let verb = faker.company.bsBuzz();
  let adjective = faker.company.bsAdjective();
  if (!message) {
    random_message = true;
    message = `${verb[0].toUpperCase()}${verb.slice(1)} ${adjective} ${noun}.`;
  }
  const imageOptions = req.query;
  imageOptions['message'] = message;

  const itemsColl = admin.firestore().collection('items');

  let imageResults: { localPath: string, baseName: string, details: string };
  let posterFile = '';
  let colorizedFile = '';
  let baseName = '';
  const tmpFiles = [];
  try {
    const imageMaker = new ImageMaker();
    imageResults = await imageMaker.make(imageOptions);
    console.log('imageMaker.make results:', imageResults);
    baseName = imageResults.baseName;
    let datafile =  imageResults.localPath;  // reference to the one we're uploading
    tmpFiles.push(datafile)
    const posterPromises = colors.map(async color => {
      if (color !== 'black') {
        colorizedFile = await imageMaker.colorize(color, imageResults.localPath, baseName);
        datafile = colorizedFile;
        tmpFiles.push(datafile)
        console.log('colorizedFile:', colorizedFile);
        if (random_message) {
          noun = faker.company.bsNoun();
          verb = faker.company.bsBuzz();
          adjective = faker.company.bsAdjective();
          message = `${verb[0].toUpperCase()}${verb.slice(1)} ${adjective} ${noun}.`;
        }
      }

      // posterFile = await imageMaker.addCaption(message,
      //                                             baseName,
      //                                             imageResults.localPath);

      const docRef = itemsColl.doc();
      // Upload to Storage with the same name as the id of the doc to be created
      const storagePath = `images/${docRef.id}.png`;
      console.log('uploading to:', storagePath);

      const uploadOptions = { destination: storagePath };
      const bucket = admin.storage().bucket();
      const files = await bucket.upload(datafile, uploadOptions);
      console.log('uploaded:', storagePath);

      // Generate a public download URL
      const downloadUrl = await files[0].getSignedUrl({
        action: 'read',
        expires: '2099-01-01'
      });
      console.log('downloadUrl:', downloadUrl);

      // Add the doc data
      const docData = {
        topic: noun,
        message: message,
        price: randomPrice(),
        color: color,
        style: style,
        created: new Date(),
        storagePath: storagePath,
        url: downloadUrl[0],
        details: imageResults.details
      }
      await docRef.set(docData);
      return docData;
    })
    const results = await Promise.all(posterPromises);

    deleteFiles(tmpFiles);
    res.json(results);
  }
  catch (err) {
    console.error(err)
    deleteFiles(tmpFiles);
    res.status(500).send(err)
  }
});

/**

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
 */

// list fonts available on the system
export const listFonts = functions.https.onRequest(async (req, res) => {
  try {
    const result = await listAvailableFonts();
    console.log(result);
    res.json(result.stdout);
  }
  catch (e) {
    res.status(500).send(e)
  }
})

