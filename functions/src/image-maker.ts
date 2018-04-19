import Storage = require('@google-cloud/storage');
const spawn = require('child-process-promise').spawn;
const fs = require('fs');
const os = require('os');
const path = require('path');

const IMAGE_WIDTH = 600;
const IMAGE_HEIGHT = 400;
const X_MIN=-2.0
const X_MAX=2.0
const Y_MIN=-2.0
const Y_MAX=2.0
// function f(z) = zd + c
const CRE=-0.4 // the real component of the complex parameter c
const CIM=0.6 // the imaginary component of the complex parameter c
const D=2   //  the real parameter d
const C=10 // color_multiplier


export class ImageMaker {
  private bucket: any;
  constructor(projectId: string, bucketName: string) {
    let storageConfg = {
      projectId: projectId,
      keyFilename: 'storage-credential.json'
    }

    const storage = Storage(storageConfg);

    console.log('Storate init complete');
    this.bucket = storage.bucket(bucketName);
    console.log('Storate bucket', this.bucket);
  };

  // x_min:number = X_MIN,
  // x_max:number = X_MAX

  make(options:any):Promise<string> {
    let d = parseInt(options['d']) || 3;
    console.log('d=', d);
    const metadata = {
      contentType: 'image/png',
      // TODO: enable Client-side caching you can set the Cache-Control headers here. Uncomment below.
      // 'Cache-Control': 'public,max-age=3600',
    };

    let filePath  = `julia_${d}`;
    const tempLocalFilePng = path.join(os.tmpdir(), filePath + '.png');
    const tempLocalFilePpm = path.join(os.tmpdir(), filePath + '.ppm');

    //const tempLocalFile = 'fractastic/examples/julia1.png';
    console.log('making', tempLocalFilePpm);

    // `${tempLocalFilePpm}`
    const pemFile = fs.createWriteStream(tempLocalFilePpm);
    return spawn('./fractastic/fractastic',
      ['J', `${IMAGE_WIDTH}`, `${IMAGE_HEIGHT}`,
       '-2', '2', '-2', '2',
       '1000', '1',
       '-0.4', '0.6', d],
      { capture: [ 'stdout', 'stderr' ]})
    .then((result) => {
      console.log('fractastic completed without error');
      pemFile.write(result.stdout);
      pemFile.end();
      //    convert $output_file.ppm $output_file.png
      return spawn('convert', [tempLocalFilePpm, tempLocalFilePng], { capture: [ 'stdout', 'stderr' ]})
      .then((convertResult) => {
        console.log('[spawn] stdout: ', convertResult.stdout.toString());
        return this.bucket.upload(tempLocalFilePng, {destination: '/test/julia2.png', metadata: metadata}).then(() => {
          return "Ok!";
        })
        .catch(function (err) {
          console.error('[bucket.upload] err: ', err);
        });

      })
    })
    .catch(function (err) {
      console.error('[spawn] err: ', err);
      console.error('[spawn] err.stderr: ', err.stderr);
      console.error('[spawn] err.stdout: ', err.stdout);
      return "there was an error"
    });
  }
}
