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
  { name: 'julia', alias: 'j', type: String }
])

console.log('options', options);
const configUrl = options.url
if (!configUrl) {
  throw new Error('No url given')
}

const configRepeat = options.repeat || false
const configJulia = options.julia == null || false

const configBatchSize = options['batch-size'] || 1
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
          args.push(`d=${d}&cre=${cre}&cim=${cim}&c=${c}&x_min=${min}&x_max=${max}&y_min=${min}&y_max=${max}`)
        }
      }
    }
  }
  return args;
}
async function doBatchFromArgs(baseUrl: string, queryArgs:Array<string>) {
  const promises: Promise<WebRequest.Response<string>>[] = []
  queryArgs.forEach(a => {
    const requestURL = `${baseUrl}?${a}`;
    console.log(`requestURL: ${requestURL}`);
    promises.push(WebRequest.get(requestURL));
  })
  return Promise.all(promises)
  .then(responses => {
    let count = 0;
    responses.forEach(response => {
      count = count+1;
      if (response.statusCode === 200) {
        const result = JSON.parse(response.content)
        console.log(`#${count}: ${result[0].details}`)
      }
      else {
        console.error(`#${count}: ${response.statusCode} ${response.statusMessage} ${response.content}`)
      }
    })
  })
}




console.log(`Requesting ${configUrl}`)
console.log(`Batch size: ${configBatchSize}`)

;(async () => {
  console.log(`configJulia ${configJulia}`)

  if (configJulia) {
    console.log('Running Julia Series')
    const args = generateJuliaSeriesArgs();
    console.log(`${args.length} variations`)
    await doBatchFromArgs(configUrl, args.slice(0,100))
  } else if (configRepeat) {
    console.log('Repeating')
    while (true) {
      await doBatch(configUrl, configBatchSize)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  else {
    await doBatch(configUrl, configBatchSize)
  }
})()
.catch(err => console.error(err))
