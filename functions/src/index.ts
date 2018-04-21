import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as faker from 'faker'
import { ImageMaker } from './image-maker';

admin.initializeApp();

console.log(process.env)
const PROJECT_ID = process.env.GCLOUD_PROJECT

function getConfig() {
  const config = functions.config();
  console.log('using config', config);
  return config;
}

function generateImage(options: any) {
  const config = getConfig();
  const bucketName =  config['storage'].bucket as string;
  const fakeImage = new ImageMaker(PROJECT_ID, bucketName);
  return fakeImage.make(options);
}

const COLLECTION_NAME = 'items';

async function addToCollection(obj: any) {
  const config = getConfig();
  const name = COLLECTION_NAME;
  const ref = await admin.firestore().collection(name).add(obj);
  return {
    id: ref.id,
    collection: name,
    doc: obj
  };
}


export const newImage = functions.https.onRequest(async (request, response) => {
  const result = await generateImage({})
  console.log('fakeImage.make result', result);
  response.send(result);
});


export const addDocument = functions.https.onRequest(async (req, res) => {
  console.log('addDocument query', req.query);

  if (! ('name' in req.query)) {
    res.status(400).send({ error: "name not given" })
    return null
  }

  if (! ('value' in req.query)) {
    res.status(400).send({ error: "value not given" })
    return null
  }

  const name = req.query.name;
  const value = req.query.value;
  const data = { name: value };

  try {
    const result = await addToCollection(data)
    res.json(result);
  }
  catch (e) {
    res.status(500).send(e)
  }
});


export const addFake = functions.https.onRequest(async (req, res) => {
  console.log('addFake query', req.query);
  const name = req.query.name || 'text';
  const value = faker.hacker.phrase();
  const data = { name: value };

  try {
    const result = await addToCollection(data);
    res.json(result);
  }
  catch (e) {
    res.status(500).send(e)
  }
});

function randomPrice() {
  // 5-25
  const base_price = (Math.floor(Math.random() * 5) + 1)*5;
  return base_price + 0.99
}
export const addFakePoster = functions.https.onRequest(async (req, res) => {
  console.log('addFakePoster query', req.query);
  const imageOptions = {}
  imageOptions['d'] = req.query['d'];
  const noun = faker.company.bsNoun();
  const verb = faker.company.bsBuzz();
  const adjective = faker.company.bsAdjective();
  const obj = {
    message: `${verb} ${adjective} ${noun}`,
    color: 'black',
    topic: noun
  };

  try {
    const imageResults = await generateImage(imageOptions);
    console.log('fakeImage.make results:', imageResults);

    await Promise.all(imageResults.map(imageData => {
      console.log('imageData:', imageData);
      obj['path'] = imageData['path'];
      obj['color'] = imageData['color'];
      obj['price'] = randomPrice();
      return addToCollection(obj);
    }))
    res.json(imageResults);
  }
  catch (e) {
    res.status(500).send(e)
  }
});
