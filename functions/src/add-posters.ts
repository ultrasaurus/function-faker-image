// Run with:
//   node lib/add-posters.js -u <url> -b <number> -r
//
// -b and -r are optional

import * as WebRequest from 'web-request'
// import * as args from 'command-line-args'
const args = require('command-line-args')

const options = args([
  { name: 'batch-size', alias: 'b', type: Number },
  { name: 'repeat', alias: 'r', type: Boolean },
  { name: 'url', alias: 'u', type: String }
])

const configUrl = options.url
if (!configUrl) {
  throw new Error('No url given')
}

const configRepeat = options.repeat || false

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

console.log(`Requesting ${configUrl}`)
console.log(`Batch size: ${configBatchSize}`)
console.log('Repeating')

;(async () => {
  if (configRepeat) {
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
