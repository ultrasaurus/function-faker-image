// Run with:
//   node lib/add-posters.js -u <url> -b <number> -r
//
// -b and -r are optional



import * as WebRequest from 'web-request'
// import * as args from 'command-line-args'
const commandArgs = require('command-line-args')

const options = commandArgs([
  { name: 'batch-size', alias: 'b', type: Number },
  { name: 'repeat', alias: 'r', type: Boolean },
  { name: 'url', alias: 'u', type: String },
  { name: 'type', alias: 't', type: String },
  { name: 'wait', alias: 'w', type: String},    // time to wait in between batches
  { name: 'start', alias: 's', type: String},
  { name: 'end', alias: 'e', type: String}
])

console.log('options', options);
const configUrl = options.url
if (!configUrl) {
  throw new Error('No url given')
}


const configWaitTime = parseInt(options.wait) || 500
const configStart = parseInt(options.start) || 0

const configRepeat = options.repeat || false
const configType = options.type || false

const configBatchSize = parseInt(options['batch-size']) || 1
if (configBatchSize < 0) {
  throw new Error('Batch size must be 1 or greater')
}


async function doBatch(baseUrl: string, batchSize: number) {
  const promises: Promise<WebRequest.Response<string>>[] = []
  for (let i = 0; i < batchSize; i++) {
    promises.push(WebRequest.get(baseUrl))
  }
  return Promise.all(promises)
  .then(responses => {
    responses.forEach(response => {
      if (response.statusCode === 200) {
        const item = JSON.parse(response.content)
        console.log(`New item: ${item.message}`)
      }
      else {
        console.error(`${response.statusCode} ${response.statusMessage} ${response.content}`)
      }
    })
  })
}

const MIN=-2.0;
const MAX=2.0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateJuliaSeriesArgs() {
  const args=[];
  const d=2;
  for (let c=10; c<=40; c=c+5) {
    for (let cre=-0.4; cre<1.1; cre=cre+0.1) {
      for (let cim=-0.1; cim < 0.6; cim=cim+0.1) {
        for (let shift = 0.0; shift <= 2.6; shift=shift+0.1) {
          const min= MIN + shift*2;
          const max= MAX - shift;
          args.push(`type=J&d=${d}&cre=${cre}&cim=${cim}&c=${c}&x_min=${min}&x_max=${max}&y_min=${min}&y_max=${max}`)
        }
      }
    }
  }
  return args;
}

function generateMandelbrotSeriesArgs() {
  const args=[];
  for (let c=10; c<=40; c=c+5) {
    for (let shift = 0.0; shift <= 2.6; shift=shift+0.1) {
      const min= MIN + shift*2;
      const max= MAX - shift;
      for (let d=5; d<=10; d=d+1) {
        args.push(`type=M&d=${d}&c=${c}&x_min=${min}&x_max=${max}&y_min=${min}&y_max=${max}`)
      }
    }
  }
  return args;
}


async function doBatchFromArgs(baseUrl: string, queryArgs:Array<string>) {
  const promises: Promise<WebRequest.Response<string>>[] = []
  console.log('queryArgs ', queryArgs)
  queryArgs.forEach(a => {
    const requestURL = `${baseUrl}?${a}`;
    //console.log(`requestURL: ${requestURL}`);
    promises.push(WebRequest.get(requestURL));
  })
  return Promise.all(promises)
}




console.log(`Requesting ${configUrl}`)
console.log(`Batch size: ${configBatchSize}`)

;(async () => {
  console.log(`configType ${configType}`)

  let args = [];
  if (configType == 'j') {
    console.log('Running Julia Series')
    args = generateJuliaSeriesArgs();
    console.log(`${args.length} variations total`)
  } else {
    console.log('Running Mandelbrot Series')
    args = generateMandelbrotSeriesArgs();
    console.log(`${args.length} variations total`)
  }
  const allVariations = args.length;
  const limitVariations = parseInt(options.end || allVariations)
  const promises = [];
  const batchSize = configBatchSize;
  const waitTime = configWaitTime;
  console.log(`last variation: ${limitVariations}`)
  console.log(`batchSize: ${configBatchSize}, waitTime: ${configWaitTime}`)
  if (batchSize == 1) {
    console.log('Repeating')
    do {
      const randIndex = (Math.floor(Math.random() * allVariations))
      await doBatchFromArgs(configUrl, args.slice(randIndex, randIndex+1))

      await new Promise(resolve => setTimeout(resolve, 1000));
    } while(configRepeat)
  } else {
  let count = 0;
  let errors = 0;
  for (let i=configStart; i<=limitVariations; i=i+batchSize) {
    let sliceEnd = i+batchSize;  // slice end is not included in the slice
    console.log(`i=${i} sliceEnd=${sliceEnd}`)
    if (sliceEnd > limitVariations) sliceEnd = limitVariations;
    if (i == sliceEnd) { break; }
    console.log(`push batch ${i}-${sliceEnd}`)
    promises.push(
      doBatchFromArgs(configUrl, args.slice(i, sliceEnd))
      .then(responses => {
        responses.forEach(response => {
          console.log(`batch ${i}-${i+batchSize-1}`)
          count = count+1;
          if (response.statusCode === 200) {
            const result = JSON.parse(response.content)
            console.log(`#${count}: ${result[0].details}`)
            console.log(`    ${result[0].storagePath}`)
            console.log(`    ${result[0].url}`)
          }
          else {
            console.error(`#${count}: ${response.statusCode} ${response.statusMessage} ${response.content}`)
            errors = errors +1
          }
        })
      })
    )
    await sleep(waitTime);
  }
  await Promise.all(promises).then(() => {
    console.log(`All should be complete. ${errors} errors`)
  })
}
})()
.catch(err => console.error(err))
